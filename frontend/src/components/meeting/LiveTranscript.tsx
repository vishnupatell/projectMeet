'use client';

import { useEffect, useRef } from 'react';
import { Loader2, Captions } from 'lucide-react';

export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number; // ms since epoch
}

interface LiveTranscriptProps {
  segments: TranscriptSegment[];
  isTranscribing: boolean;
  isProcessing: boolean; // waiting for AI response
}

export function LiveTranscript({ segments, isTranscribing, isProcessing }: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  if (!isTranscribing && segments.length === 0) return null;

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="border-t border-white/10 bg-ink-900/80 backdrop-blur px-4 py-3 max-h-40 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <Captions className="h-4 w-4 text-brand-400" />
        <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Live Transcript</span>
        {isProcessing && (
          <Loader2 className="h-3 w-3 text-slate-400 animate-spin ml-1" />
        )}
      </div>

      <div className="space-y-1">
        {segments.length === 0 && isTranscribing && (
          <p className="text-xs text-slate-400 italic">Listening… speak to start transcribing.</p>
        )}
        {segments.map((seg) => (
          <div key={seg.id} className="flex gap-2 text-sm leading-relaxed">
            <span className="shrink-0 text-xs text-slate-500 pt-0.5 font-mono">
              {formatTime(seg.timestamp)}
            </span>
            <p className="text-white/90">{seg.text}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
