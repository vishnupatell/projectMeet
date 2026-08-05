'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleHandRaised } from '@/store/slices/featuresSlice';
import { Hand } from 'lucide-react';

export function RaiseHandButton({ socket, userId }: { socket: any; userId: string }) {
  const dispatch = useDispatch();
  const raisedHands = useSelector((state: RootState) => state.features.raisedHands);
  const isRaised = raisedHands.includes(userId);

  const toggleHand = () => {
    const newState = !isRaised;
    dispatch(toggleHandRaised({ userId, raised: newState }));
    if (socket) {
      socket.emit('meeting:raise-hand', { raised: newState });
    }
  };

  return (
    <button
      onClick={toggleHand}
      className={`p-2 rounded-full transition-colors ${
        isRaised
          ? 'bg-yellow-500 text-black hover:bg-yellow-400'
          : 'bg-gray-700 text-white hover:bg-gray-600'
      }`}
      title={isRaised ? 'Lower hand' : 'Raise hand'}
    >
      <Hand className="w-5 h-5" />
    </button>
  );
}

export function RaisedHandsIndicator() {
  const raisedHands = useSelector((state: RootState) => state.features.raisedHands);
  const participants = useSelector((state: RootState) => state.meeting.participants);

  if (raisedHands.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 bg-yellow-500/90 text-black px-3 py-2 rounded-lg shadow-lg z-40">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Hand className="w-4 h-4" />
        <span>
          {raisedHands.length} hand{raisedHands.length > 1 ? 's' : ''} raised
        </span>
      </div>
      <div className="mt-1 text-xs">
        {raisedHands.map((uid) => {
          const p = participants.find((p) => p.userId === uid);
          return <div key={uid}>{p?.displayName || 'Unknown'}</div>;
        })}
      </div>
    </div>
  );
}
