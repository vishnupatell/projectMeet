'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Clock, Users, Shield } from 'lucide-react';

export function WaitingRoom() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="animate-pulse mb-6">
        <Clock className="w-16 h-16 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Waiting Room</h2>
      <p className="text-gray-400 text-center max-w-md">
        The host will let you in shortly. Please wait...
      </p>
      <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
        <Shield className="w-4 h-4" />
        <span>Your meeting is secure</span>
      </div>
    </div>
  );
}

export function WaitingRoomManager({ socket, meetingId }: { socket: any; meetingId: string }) {
  const waitingRoom = useSelector((state: RootState) => state.features.waitingRoom);

  if (waitingRoom.length === 0) return null;

  const admitUser = (userId: string) => {
    if (socket) {
      socket.emit('meeting:admit-participant', { meetingId, targetUserId: userId });
    }
  };

  const denyUser = (userId: string) => {
    if (socket) {
      socket.emit('meeting:deny-participant', { meetingId, targetUserId: userId });
    }
  };

  const admitAll = () => {
    if (socket) {
      socket.emit('meeting:admit-all', { meetingId });
    }
  };

  return (
    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-yellow-400 text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Waiting Room ({waitingRoom.length})
        </h4>
        <button
          onClick={admitAll}
          className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded"
        >
          Admit All
        </button>
      </div>
      <div className="space-y-2">
        {waitingRoom.map((user) => (
          <div key={user.userId} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
            <span className="text-white text-sm">{user.displayName || 'Participant'}</span>
            <div className="flex gap-2">
              <button
                onClick={() => admitUser(user.userId)}
                className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded"
              >
                Admit
              </button>
              <button
                onClick={() => denyUser(user.userId)}
                className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
