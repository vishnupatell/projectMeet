'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addReaction } from '@/store/slices/featuresSlice';

const EMOJI_OPTIONS = ['👍', '👏', '❤️', '😂', '🎉', '🔥', '💯', '🤔'];

export function ReactionBar({ socket, meetingId }: { socket: any; meetingId: string }) {
  const [showPicker, setShowPicker] = useState(false);
  const dispatch = useDispatch();

  const sendReaction = (emoji: string) => {
    if (socket) {
      socket.emit('meeting:reaction', { emoji });
    }
    // Optimistically add locally too
    dispatch(addReaction({ userId: '', emoji, timestamp: new Date().toISOString() }));
    setShowPicker(false);
  };

  return (
    <div className="relative">
      {/* Reaction button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="rounded-full p-3 bg-white/15 text-white hover:bg-white/25 transition-all duration-200 text-lg"
        title="React"
      >
        😀
      </button>

      {/* Picker */}
      {showPicker && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-ink-900/95 backdrop-blur rounded-xl p-2 flex gap-1 shadow-xl border border-white/10 z-50">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="text-2xl hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
