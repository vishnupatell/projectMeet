'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { addActionItem, updateActionItem, removeActionItem } from '@/store/slices/featuresSlice';
import { CheckSquare, Plus, Trash2, Circle, CheckCircle2, Clock } from 'lucide-react';
import { API_URL } from '@/lib/config';
import type { ActionItem } from '@/types';

export function ActionItemPanel({ meetingId }: { meetingId: string }) {
  const dispatch = useDispatch();
  const actionItems = useSelector((state: RootState) => state.features.actionItems);
  const [newTitle, setNewTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/action-items/meeting/${meetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(addActionItem(data.data));
        setNewTitle('');
        setShowAdd(false);
      }
    } catch (error) {
      console.error('Failed to add action item:', error);
    }
  };

  const handleStatusChange = async (item: ActionItem, status: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/action-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        dispatch(updateActionItem(data.data));
      }
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/action-items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(removeActionItem(itemId));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5" /> Action Items
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="New action item..."
            className="flex-1 px-3 py-2 bg-gray-800 rounded text-white text-sm placeholder-gray-400"
          />
          <button onClick={handleAdd} className="px-3 py-2 bg-blue-600 rounded text-white text-sm">
            Add
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {actionItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
            <button
              onClick={() => {
                const next = item.status === 'PENDING' ? 'IN_PROGRESS' : item.status === 'IN_PROGRESS' ? 'COMPLETED' : 'PENDING';
                handleStatusChange(item, next);
              }}
            >
              {statusIcon(item.status)}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-white'}`}>
                {item.title}
              </p>
              {item.assignee && (
                <p className="text-xs text-gray-400">→ {item.assignee.displayName}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1 rounded hover:bg-red-600/50 text-gray-400 hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {actionItems.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No action items yet</p>
        )}
      </div>
    </div>
  );
}
