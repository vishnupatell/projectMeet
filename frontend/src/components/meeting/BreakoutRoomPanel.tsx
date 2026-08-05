'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setBreakoutRooms, setCurrentBreakoutRoom, clearBreakoutRooms } from '@/store/slices/featuresSlice';
import { Users2, MessageSquare, X, Plus } from 'lucide-react';

interface BreakoutRoomConfig {
  name: string;
  participantIds: string[];
}

export function BreakoutRoomPanel({ socket, meetingId }: { socket: any; meetingId: string }) {
  const dispatch = useDispatch();
  const breakoutRooms = useSelector((state: RootState) => state.features.breakoutRooms);
  const currentRoom = useSelector((state: RootState) => state.features.currentBreakoutRoom);
  const participants = useSelector((state: RootState) => state.meeting.participants);
  const [showCreate, setShowCreate] = useState(false);
  const [rooms, setRooms] = useState<BreakoutRoomConfig[]>([{ name: 'Room 1', participantIds: [] }]);
  const [duration, setDuration] = useState(10); // minutes
  const [broadcastMsg, setBroadcastMsg] = useState('');

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/breakout-rooms/meeting/${meetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rooms, duration: duration * 60 }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(setBreakoutRooms(data.data));
        setShowCreate(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseAll = () => {
    if (socket) {
      socket.emit('breakout:close-all', { meetingId });
    }
    dispatch(clearBreakoutRooms());
  };

  const handleBroadcast = () => {
    if (broadcastMsg.trim() && socket) {
      socket.emit('breakout:broadcast', { meetingId, message: broadcastMsg });
      setBroadcastMsg('');
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket) {
      if (currentRoom) {
        socket.emit('breakout:leave', { roomId: currentRoom });
      }
      socket.emit('breakout:join', { roomId });
      dispatch(setCurrentBreakoutRoom(roomId));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Users2 className="w-5 h-5" /> Breakout Rooms
        </h3>
        {breakoutRooms.length === 0 ? (
          <button
            onClick={() => setShowCreate(true)}
            className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCloseAll}
            className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
          >
            Close All
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg space-y-3">
          <div className="text-sm text-gray-300 mb-2">Configure rooms:</div>
          {rooms.map((room, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={room.name}
                onChange={(e) => {
                  const newRooms = [...rooms];
                  newRooms[i].name = e.target.value;
                  setRooms(newRooms);
                }}
                className="flex-1 px-2 py-1 bg-gray-700 rounded text-white text-sm"
              />
              {rooms.length > 1 && (
                <button onClick={() => setRooms(rooms.filter((_, j) => j !== i))} className="text-red-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setRooms([...rooms, { name: `Room ${rooms.length + 1}`, participantIds: [] }])}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add room
          </button>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Duration (min):</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-gray-700 rounded text-white text-sm"
              min={1}
              max={120}
            />
          </div>
          <button
            onClick={handleCreate}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-medium"
          >
            Create Rooms
          </button>
        </div>
      )}

      {/* Active rooms */}
      {breakoutRooms.length > 0 && (
        <div className="flex-1 space-y-2 overflow-y-auto">
          {breakoutRooms.map((room) => (
            <div
              key={room.id}
              className={`p-3 rounded-lg border ${
                currentRoom === room.id ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-800 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium">{room.name}</span>
                <span className="text-xs text-gray-400">
                  {room.participants?.length || 0} users
                </span>
              </div>
              <button
                onClick={() => joinRoom(room.id)}
                className="mt-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded"
              >
                {currentRoom === room.id ? 'In Room' : 'Join'}
              </button>
            </div>
          ))}

          {/* Broadcast */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Broadcast message..."
                className="flex-1 px-2 py-1.5 bg-gray-700 rounded text-white text-sm placeholder-gray-400"
              />
              <button
                onClick={handleBroadcast}
                className="p-1.5 bg-orange-600 hover:bg-orange-500 rounded text-white"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
