'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Subtitles } from 'lucide-react';

export function LiveCaptions() {
  const captions = useSelector((state: RootState) => state.features.captions);
  const enabled = useSelector((state: RootState) => state.features.captionsEnabled);

  if (!enabled || captions.length === 0) return null;

  // Show last 3 captions
  const recentCaptions = captions.slice(-3);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4 z-40">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 space-y-1">
        {recentCaptions.map((caption, i) => (
          <div key={`${caption.timestamp}-${i}`} className="flex gap-2 text-sm">
            <span className="text-blue-400 font-medium shrink-0">
              {caption.userId.slice(0, 8)}:
            </span>
            <span className={`text-white ${!caption.isFinal ? 'opacity-60 italic' : ''}`}>
              {caption.text}
            </span>
            {caption.language !== 'en' && (
              <span className="text-xs text-gray-400 shrink-0">({caption.language})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaptionToggle({ onToggle, enabled }: { onToggle: () => void; enabled: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-full transition-colors ${
        enabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      title={enabled ? 'Disable captions' : 'Enable captions'}
    >
      <Subtitles className="w-5 h-5" />
    </button>
  );
}
