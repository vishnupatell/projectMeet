'use client';

import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { MicOff, VideoOff } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  avatarUrl?: string | null;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isLocal?: boolean;
  isActive?: boolean;
  className?: string;
}

export function VideoTile({
  stream,
  displayName,
  avatarUrl,
  isAudioOn,
  isVideoOn,
  isLocal = false,
  isActive = false,
  className,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={clsx(
        'relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_10%,#1A3A45_0%,#0B1418_60%)]',
        isActive && 'ring-2 ring-brand-400',
        className,
      )}
    >
      {stream && isVideoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Avatar name={displayName} src={avatarUrl} size="xl" />
          <span className="text-sm font-semibold text-white">{displayName}</span>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="truncate text-xs font-semibold text-white">
            {isLocal ? 'You' : displayName}
          </span>
          <div className="flex items-center gap-1.5">
            {!isAudioOn && (
              <div className="rounded-full bg-red-500 p-1">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            )}
            {!isVideoOn && (
              <div className="rounded-full bg-red-500 p-1">
                <VideoOff className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
