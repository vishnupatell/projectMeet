import type { IceServer } from '@/types';
import { socketService } from './socket';

export type PeerConnectionMap = Map<string, {
  connection: RTCPeerConnection;
  stream: MediaStream | null;
}>;

class WebRTCService {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peerConnections: PeerConnectionMap = new Map();
  private iceServers: IceServer[] = [];

  // Recording state
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartedAt: Date | null = null;
  private onRecordingAvailable: ((blob: Blob, startedAt: Date) => void) | null = null;

  // Callbacks
  private onRemoteStream: ((userId: string, stream: MediaStream) => void) | null = null;
  private onRemoteStreamRemoved: ((userId: string) => void) | null = null;

  setIceServers(servers: IceServer[]) {
    this.iceServers = servers;
  }

  setOnRemoteStream(callback: (userId: string, stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  setOnRemoteStreamRemoved(callback: (userId: string) => void) {
    this.onRemoteStreamRemoved = callback;
  }

  async getLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: video ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      } : false,
      audio: audio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } : false,
    });

    return this.localStream;
  }

  async getScreenStream(): Promise<MediaStream> {
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' } as any,
      audio: false,
    });

    this.screenStream.getVideoTracks()[0].onended = () => {
      this.stopScreenShare();
    };

    return this.screenStream;
  }

  createPeerConnection(remoteUserId: string): RTCPeerConnection {
    const configuration: RTCConfiguration = {
      iceServers: this.iceServers.map((server) => ({
        urls: server.urls,
        username: server.username,
        credential: server.credential,
      })),
    };

    const pc = new RTCPeerConnection(configuration);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit('webrtc:ice-candidate', {
          targetUserId: remoteUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (this.onRemoteStream) {
        this.onRemoteStream(remoteUserId, remoteStream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.warn(`[WebRTC] Peer ${remoteUserId} connection state: ${pc.iceConnectionState}`);
      }
      if (pc.iceConnectionState === 'closed') {
        this.removePeer(remoteUserId);
      }
    };

    this.peerConnections.set(remoteUserId, { connection: pc, stream: null });
    return pc;
  }

  async createOffer(remoteUserId: string): Promise<RTCSessionDescriptionInit> {
    let peer = this.peerConnections.get(remoteUserId);
    if (!peer) {
      this.createPeerConnection(remoteUserId);
      peer = this.peerConnections.get(remoteUserId)!;
    }

    const offer = await peer.connection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peer.connection.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(
    remoteUserId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    let peer = this.peerConnections.get(remoteUserId);
    if (!peer) {
      this.createPeerConnection(remoteUserId);
      peer = this.peerConnections.get(remoteUserId)!;
    }

    await peer.connection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(remoteUserId: string, answer: RTCSessionDescriptionInit) {
    const peer = this.peerConnections.get(remoteUserId);
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleIceCandidate(remoteUserId: string, candidate: RTCIceCandidateInit) {
    const peer = this.peerConnections.get(remoteUserId);
    if (peer) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  removePeer(userId: string) {
    const peer = this.peerConnections.get(userId);
    if (peer) {
      peer.connection.close();
      this.peerConnections.delete(userId);
      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(userId);
      }
    }
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  async startScreenShare(): Promise<MediaStream> {
    const stream = await this.getScreenStream();

    // Replace video track in all peer connections
    const videoTrack = stream.getVideoTracks()[0];
    this.peerConnections.forEach(({ connection }) => {
      const sender = connection.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    return stream;
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Restore camera track
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (videoTrack) {
      this.peerConnections.forEach(({ connection }) => {
        const sender = connection.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    }

    socketService.emit('meeting:screen-share-stop');
  }

  cleanup() {
    this.peerConnections.forEach(({ connection }) => {
      connection.close();
    });
    this.peerConnections.clear();

    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;

    this.screenStream?.getTracks().forEach((track) => track.stop());
    this.screenStream = null;

    this.onRemoteStream = null;
    this.onRemoteStreamRemoved = null;
  }

  setOnRecordingAvailable(callback: (blob: Blob, startedAt: Date) => void) {
    this.onRecordingAvailable = callback;
  }

  startRecording(): boolean {
    const stream = this.localStream;
    if (!stream) return false;

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    this.recordedChunks = [];
    this.recordingStartedAt = new Date();
    this.mediaRecorder = new MediaRecorder(stream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      if (this.onRecordingAvailable && this.recordingStartedAt) {
        this.onRecordingAvailable(blob, this.recordingStartedAt);
      }
      this.recordedChunks = [];
      this.recordingStartedAt = null;
    };

    this.mediaRecorder.start(1000); // collect chunks every 1s
    return true;
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  getLocalStreamRef(): MediaStream | null {
    return this.localStream;
  }

  getPeerConnections(): PeerConnectionMap {
    return this.peerConnections;
  }
}

export const webrtcService = new WebRTCService();
