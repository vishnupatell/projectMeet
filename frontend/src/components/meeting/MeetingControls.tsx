'use client';

import clsx from 'clsx';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Phone,
  MessageSquare,
  Users,
} from 'lucide-react';

interface MeetingControlsProps {
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  participantCount: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onLeaveMeeting: () => void;
}

export function MeetingControls({
  isAudioOn,
  isVideoOn,
  isScreenSharing,
  isChatOpen,
  participantCount,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onLeaveMeeting,
}: MeetingControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-ink-900/90 px-6 py-4 backdrop-blur">
      {/* Audio */}
      <button
        onClick={onToggleAudio}
        className={clsx(
          'rounded-full p-3 transition-all duration-200',
          isAudioOn
            ? 'bg-white/15 text-white hover:bg-white/25'
            : 'bg-red-500 hover:bg-red-600 text-white',
        )}
        title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>

      {/* Video */}
      <button
        onClick={onToggleVideo}
        className={clsx(
          'rounded-full p-3 transition-all duration-200',
          isVideoOn
            ? 'bg-white/15 text-white hover:bg-white/25'
            : 'bg-red-500 hover:bg-red-600 text-white',
        )}
        title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>

      {/* Screen Share */}
      <button
        onClick={onToggleScreenShare}
        className={clsx(
          'rounded-full p-3 transition-all duration-200',
          isScreenSharing
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'bg-white/15 text-white hover:bg-white/25',
        )}
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      >
        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
      </button>

      {/* Chat */}
      <button
        onClick={onToggleChat}
        className={clsx(
          'rounded-full p-3 transition-all duration-200',
          isChatOpen
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'bg-white/15 text-white hover:bg-white/25',
        )}
        title="Toggle chat"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* Participants */}
      <div className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-sm text-white">
        <Users className="h-4 w-4" />
        <span className="font-semibold">{participantCount}</span>
      </div>

      {/* Leave */}
      <button
        onClick={onLeaveMeeting}
        className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-red-700"
      >
        <Phone className="h-5 w-5 rotate-[135deg]" />
        Leave
      </button>
    </div>
  );
}
