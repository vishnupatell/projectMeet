'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/useStore';
import { joinMeetingRequest, leaveMeetingSuccess, setAudioOn, setVideoOn, setScreenSharing, participantJoined, participantLeft, participantToggleAudio, participantToggleVideo } from '@/store/slices/meetingSlice';
import { setChatOpen, newMessage } from '@/store/slices/chatSlice';
import { selectCurrentMeeting, selectIsAudioOn, selectIsVideoOn, selectIsScreenSharing, selectParticipants } from '@/store/selectors/meetingSelectors';
import { selectIsChatOpen } from '@/store/selectors/chatSelectors';
import { selectUser } from '@/store/selectors/authSelectors';
import { socketService } from '@/lib/services/socket';
import { webrtcService } from '@/lib/services/webrtc';
import { apiClient } from '@/lib/services/api';
import type { Message } from '@/types';
import { VideoTile } from '@/components/meeting/VideoTile';
import { MeetingControls } from '@/components/meeting/MeetingControls';
import { MeetingChat } from '@/components/chat/MeetingChat';
import { MeetingAIAssistant } from '@/components/meeting/MeetingAIAssistant';
import type { TranscriptSegment } from '@/components/meeting/LiveTranscript';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PanelLeftClose, PanelLeftOpen, Maximize, Minimize, Sparkles } from 'lucide-react';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

interface RemoteStream {
  userId: string;
  stream: MediaStream;
  displayName: string;
  avatarUrl: string | null;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const code = params.code as string;

  const currentMeeting = useAppSelector(selectCurrentMeeting);
  const isAudioOn = useAppSelector(selectIsAudioOn);
  const isVideoOn = useAppSelector(selectIsVideoOn);
  const isScreenSharing = useAppSelector(selectIsScreenSharing);
  const participants = useAppSelector(selectParticipants);
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const user = useAppSelector(selectUser);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const joinedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcribeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSegmentRef = useRef<string>('');

  const handleToggleImmersive = useCallback(() => {
    setIsImmersive((v) => !v);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (rootRef.current) {
        await rootRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Initialize meeting
  useEffect(() => {
    if (!code || joinedRef.current) return;
    joinedRef.current = true;

    const initMeeting = async () => {
      try {
        // Join via API
        dispatch(joinMeetingRequest({ code }));

        // Get ICE servers
        const iceResponse = await apiClient.getIceServers();
        if (iceResponse.data) {
          webrtcService.setIceServers(iceResponse.data);
        }

        // Get local media
        const stream = await webrtcService.getLocalStream(true, true);
        setLocalStream(stream);

        // Set up remote stream handler
        webrtcService.setOnRemoteStream((userId, stream) => {
          setRemoteStreams((prev) => {
            const existing = prev.find((r) => r.userId === userId);
            if (existing) {
              return prev.map((r) => (r.userId === userId ? { ...r, stream } : r));
            }
            return [...prev, { userId, stream, displayName: 'Participant', avatarUrl: null }];
          });
        });

        webrtcService.setOnRemoteStreamRemoved((userId) => {
          setRemoteStreams((prev) => prev.filter((r) => r.userId !== userId));
        });

        // Socket events for WebRTC signaling
        socketService.emit('meeting:join', { meetingCode: code });
        setIsJoining(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to join meeting');
        setIsJoining(false);
      }
    };

    initMeeting();
  }, [code, dispatch]);

  // Socket listeners
  useEffect(() => {
    const handleExistingParticipants = async (data: { participants: string[] }) => {
      // Create offers to all existing participants
      for (const userId of data.participants) {
        const offer = await webrtcService.createOffer(userId);
        socketService.emit('webrtc:offer', { targetUserId: userId, offer });
        dispatch(participantJoined({ userId, displayName: 'Participant', avatarUrl: null }));
      }
    };

    const handleUserJoined = (data: { userId: string }) => {
      dispatch(participantJoined({ userId: data.userId, displayName: 'Participant', avatarUrl: null }));
    };

    const handleUserLeft = (data: { userId: string }) => {
      dispatch(participantLeft({ userId: data.userId }));
      webrtcService.removePeer(data.userId);
    };

    const handleOffer = async (data: { offer: RTCSessionDescriptionInit; fromUserId: string; targetUserId: string }) => {
      if (data.targetUserId === user?.id || !data.targetUserId) {
        const answer = await webrtcService.handleOffer(data.fromUserId, data.offer);
        socketService.emit('webrtc:answer', { targetUserId: data.fromUserId, answer });
      }
    };

    const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; fromUserId: string; targetUserId: string }) => {
      if (data.targetUserId === user?.id || !data.targetUserId) {
        await webrtcService.handleAnswer(data.fromUserId, data.answer);
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; fromUserId: string; targetUserId: string }) => {
      if (data.targetUserId === user?.id || !data.targetUserId) {
        await webrtcService.handleIceCandidate(data.fromUserId, data.candidate);
      }
    };

    const handleToggleAudio = (data: { userId: string; isAudioOn: boolean }) => {
      dispatch(participantToggleAudio(data));
    };

    const handleToggleVideo = (data: { userId: string; isVideoOn: boolean }) => {
      dispatch(participantToggleVideo(data));
    };

    const handleNewMessage = (message: Message) => {
      dispatch(newMessage(message));
    };

    socketService.on('meeting:existing-participants', handleExistingParticipants);
    socketService.on('meeting:user-joined', handleUserJoined);
    socketService.on('meeting:user-left', handleUserLeft);
    socketService.on('webrtc:offer', handleOffer);
    socketService.on('webrtc:answer', handleAnswer);
    socketService.on('webrtc:ice-candidate', handleIceCandidate);
    socketService.on('meeting:user-toggle-audio', handleToggleAudio);
    socketService.on('meeting:user-toggle-video', handleToggleVideo);
    socketService.on('chat:new-message', handleNewMessage);

    return () => {
      socketService.off('meeting:existing-participants', handleExistingParticipants);
      socketService.off('meeting:user-joined', handleUserJoined);
      socketService.off('meeting:user-left', handleUserLeft);
      socketService.off('webrtc:offer', handleOffer);
      socketService.off('webrtc:answer', handleAnswer);
      socketService.off('webrtc:ice-candidate', handleIceCandidate);
      socketService.off('meeting:user-toggle-audio', handleToggleAudio);
      socketService.off('meeting:user-toggle-video', handleToggleVideo);
      socketService.off('chat:new-message', handleNewMessage);
    };
  }, [dispatch, user?.id]);

  const handleToggleAudio = useCallback(() => {
    const newState = !isAudioOn;
    webrtcService.toggleAudio(newState);
    dispatch(setAudioOn(newState));
    socketService.emit('meeting:toggle-audio', { isAudioOn: newState });
  }, [isAudioOn, dispatch]);

  const handleToggleVideo = useCallback(() => {
    const newState = !isVideoOn;
    webrtcService.toggleVideo(newState);
    dispatch(setVideoOn(newState));
    socketService.emit('meeting:toggle-video', { isVideoOn: newState });
  }, [isVideoOn, dispatch]);

  const handleToggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        webrtcService.stopScreenShare();
        dispatch(setScreenSharing(false));
      } else {
        await webrtcService.startScreenShare();
        dispatch(setScreenSharing(true));
        socketService.emit('meeting:screen-share-start');
      }
    } catch (err) {
      console.error('Screen share error:', err);
    }
  }, [isScreenSharing, dispatch]);

  const handleToggleChat = useCallback(() => {
    dispatch(setChatOpen(!isChatOpen));
  }, [isChatOpen, dispatch]);

  const sendAudioChunk = useCallback(async (chunks: Blob[]) => {
    if (chunks.length === 0) return;
    const blob = new Blob(chunks, { type: 'audio/webm' });
    if (blob.size < 1000) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'chunk.webm');
      if (lastSegmentRef.current) {
        formData.append('initial_prompt', lastSegmentRef.current);
      }
      const res = await fetch(`${AI_SERVICE_URL}/transcribe-upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.full_text?.trim()) {
        const segText = data.full_text.trim();
        lastSegmentRef.current = segText.slice(-200);
        setTranscriptSegments((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, text: segText, timestamp: Date.now() },
        ]);
        // Push to backend so late joiners can ask AI about it
        if (currentMeeting?.id) {
          apiClient.pushLiveSegment(currentMeeting.id, segText).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Transcription chunk failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleToggleTranscribe = useCallback(() => {
    if (isTranscribing) {
      if (transcribeIntervalRef.current) {
        clearInterval(transcribeIntervalRef.current);
        transcribeIntervalRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
      setIsTranscribing(false);
    } else {
      if (!localStream) return;
      const audioStream = new MediaStream(localStream.getAudioTracks());
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });
      } catch {
        recorder = new MediaRecorder(audioStream);
      }
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsTranscribing(true);
      setTranscriptSegments([]);

      transcribeIntervalRef.current = setInterval(() => {
        const current = mediaRecorderRef.current;
        if (!current || current.state === 'inactive') return;
        current.onstop = () => {
          const chunks = [...audioChunksRef.current];
          audioChunksRef.current = [];
          sendAudioChunk(chunks);
          try {
            const next = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });
            next.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorderRef.current = next;
            next.start();
          } catch {}
        };
        current.stop();
      }, 8000);
    }
  }, [isTranscribing, localStream, sendAudioChunk]);

  // Cleanup transcription on unmount
  useEffect(() => {
    return () => {
      if (transcribeIntervalRef.current) clearInterval(transcribeIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleLeaveMeeting = useCallback(() => {
    socketService.emit('meeting:leave');
    webrtcService.cleanup();
    dispatch(leaveMeetingSuccess());
    router.push('/dashboard');
  }, [dispatch, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketService.emit('meeting:leave');
      webrtcService.cleanup();
    };
  }, []);

  if (isJoining) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_35%_0%,#164553_0%,#0D161A_55%)]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
            <p className="text-white text-lg">Joining meeting...</p>
            <p className="mt-1 text-sm text-slate-300/90">{code}</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_35%_0%,#164553_0%,#0D161A_55%)]">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const allStreams = [
    // Local
    {
      userId: user?.id || '',
      stream: localStream,
      displayName: user?.displayName || 'You',
      avatarUrl: user?.avatarUrl || null,
      isLocal: true,
    },
    // Remote
    ...remoteStreams.map((rs) => ({
      ...rs,
      isLocal: false,
    })),
  ];

  const getGridClass = () => {
    const count = allStreams.length;
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 grid-rows-2';
    if (count <= 6) return 'grid-cols-3 grid-rows-2';
    if (count <= 9) return 'grid-cols-3 grid-rows-3';
    return 'grid-cols-4 grid-rows-3';
  };

  return (
    <AuthGuard>
      <div
        ref={rootRef}
        className={
          isImmersive
            ? 'fixed inset-0 z-50 flex h-screen w-screen bg-[radial-gradient(circle_at_35%_0%,#164553_0%,#0D161A_55%)]'
            : 'flex h-full min-h-0 bg-[radial-gradient(circle_at_35%_0%,#164553_0%,#0D161A_55%)]'
        }
      >
        {/* Video Grid */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Meeting info bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-ink-900/45 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleImmersive}
                className="rounded-lg p-1.5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                title={isImmersive ? 'Show sidebar' : 'Hide sidebar'}
              >
                {isImmersive ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
              <h2 className="text-sm font-semibold text-white">
                {currentMeeting?.title || 'Meeting'}
              </h2>
              <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200">
                {code}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-slate-200/85">
                {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
              </div>
              <button                onClick={() => setIsAIOpen((v) => !v)}
                className={`rounded-lg p-1.5 transition-colors hover:bg-white/10 ${
                  isAIOpen ? 'text-brand-400' : 'text-slate-200 hover:text-white'
                }`}
                title="AI Meeting Assistant"
              >
                <Sparkles className="h-4 w-4" />
              </button>
              <button                onClick={handleToggleFullscreen}
                className="rounded-lg p-1.5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Video tiles */}
          <div className={`flex-1 min-h-0 overflow-hidden p-4 grid ${getGridClass()} gap-3 auto-rows-fr`}>
            {allStreams.map((s) => (
              <VideoTile
                key={s.userId}
                stream={s.stream}
                displayName={s.displayName}
                avatarUrl={s.avatarUrl}
                isAudioOn={s.isLocal ? isAudioOn : (participants.find(p => p.userId === s.userId)?.isAudioOn ?? true)}
                isVideoOn={s.isLocal ? isVideoOn : (participants.find(p => p.userId === s.userId)?.isVideoOn ?? true)}
                isLocal={s.isLocal}
                className="min-h-0"
              />
            ))}
          </div>

          {/* Controls */}
          <MeetingControls
            isAudioOn={isAudioOn}
            isVideoOn={isVideoOn}
            isScreenSharing={isScreenSharing}
            isChatOpen={isChatOpen}
            isRecording={false}
            isUploadingRecording={false}
            isTranscribing={isTranscribing}
            participantCount={participants.length + 1}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onToggleChat={handleToggleChat}
            onToggleRecording={() => {}}
            onToggleTranscribe={handleToggleTranscribe}
            onLeaveMeeting={handleLeaveMeeting}
          />
        </div>

        {/* Chat Panel */}
        {isChatOpen && currentMeeting?.chat && (
          <div className="w-80 flex-shrink-0 border-l border-white/10">
            <MeetingChat chatId={currentMeeting.chat.id} />
          </div>
        )}

        {/* AI Assistant Panel */}
        {isAIOpen && currentMeeting?.id && (
          <MeetingAIAssistant
            meetingId={currentMeeting.id}
            onClose={() => setIsAIOpen(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
