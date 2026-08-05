'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleCaptions, toggleWhiteboard } from '@/store/slices/featuresSlice';
import { ReactionBar } from './ReactionBar';
import { RaiseHandButton } from './RaiseHand';
import { CaptionToggle } from './LiveCaptions';
import { VirtualBackgroundSelector } from './VirtualBackground';
import { CopyInviteLink } from './CopyInviteLink';
import { MeetingTimer } from './MeetingTimer';
import { PenTool, BarChart3, Users2, File } from 'lucide-react';

interface EnhancedControlsProps {
  socket: any;
  meetingId: string;
  meetingCode: string;
  userId: string;
  startTime: string | null;
  onTogglePolls: () => void;
  onToggleBreakout: () => void;
  onToggleFiles: () => void;
  onSelectBackground: (bg: string | null) => void;
}

export function EnhancedMeetingControls({
  socket,
  meetingId,
  meetingCode,
  userId,
  startTime,
  onTogglePolls,
  onToggleBreakout,
  onToggleFiles,
  onSelectBackground,
}: EnhancedControlsProps) {
  const dispatch = useDispatch();
  const captionsEnabled = useSelector((state: RootState) => state.features.captionsEnabled);
  const isWhiteboardOpen = useSelector((state: RootState) => state.features.isWhiteboardOpen);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur border-b border-white/5">
      {/* Left: Timer + Invite */}
      <div className="flex items-center gap-3">
        <MeetingTimer startTime={startTime} />
        <CopyInviteLink meetingCode={meetingCode} />
      </div>

      {/* Center: Enhanced controls */}
      <div className="flex items-center gap-2">
        <ReactionBar socket={socket} meetingId={meetingId} />
        <RaiseHandButton socket={socket} userId={userId} />
        <CaptionToggle
          enabled={captionsEnabled}
          onToggle={() => dispatch(toggleCaptions())}
        />
        <button
          onClick={() => dispatch(toggleWhiteboard())}
          className={`p-2 rounded-full transition-colors ${
            isWhiteboardOpen ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title="Whiteboard"
        >
          <PenTool className="w-5 h-5" />
        </button>
        <button
          onClick={onTogglePolls}
          className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          title="Polls"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleBreakout}
          className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          title="Breakout Rooms"
        >
          <Users2 className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleFiles}
          className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          title="Files"
        >
          <File className="w-5 h-5" />
        </button>
        <VirtualBackgroundSelector onSelect={onSelectBackground} />
      </div>

      {/* Right: Empty space for balance */}
      <div className="w-48" />
    </div>
  );
}
