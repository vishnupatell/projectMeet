'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { createPollRequest } from '@/store/sagas/featuresSaga';
import { BarChart3, Plus, X } from 'lucide-react';
import type { Poll } from '@/types';

export function PollPanel({ socket, meetingId }: { socket: any; meetingId: string }) {
  const dispatch = useDispatch();
  const polls = useSelector((state: RootState) => state.features.polls);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleCreatePoll = () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2) return;
    dispatch(createPollRequest({
      meetingId,
      question: question.trim(),
      options: options.filter((o) => o.trim()),
      isAnonymous,
    }));
    setQuestion('');
    setOptions(['', '']);
    setShowCreate(false);
  };

  const handleVote = (pollId: string, optionId: string) => {
    if (socket) {
      socket.emit('poll:voted', { pollId, optionId });
    }
    // Also call API
    fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Polls
        </h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg space-y-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full px-3 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm"
          />
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  newOpts[i] = e.target.value;
                  setOptions(newOpts);
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-1.5 bg-gray-700 rounded text-white placeholder-gray-400 text-sm"
              />
              {options.length > 2 && (
                <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-red-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              onClick={() => setOptions([...options, ''])}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              + Add option
            </button>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            Anonymous voting
          </label>
          <button
            onClick={handleCreatePoll}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-medium"
          >
            Launch Poll
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} onVote={handleVote} />
        ))}
        {polls.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No polls yet</p>
        )}
      </div>
    </div>
  );
}

function PollCard({ poll, onVote }: { poll: Poll; onVote: (pollId: string, optionId: string) => void }) {
  const options = poll.options as { id: string; text: string }[];
  const totalVotes = poll.votes?.length || 0;

  return (
    <div className="p-3 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white text-sm font-medium">{poll.question}</h4>
        <span className={`text-xs px-2 py-0.5 rounded ${poll.isActive ? 'bg-green-600' : 'bg-gray-600'} text-white`}>
          {poll.isActive ? 'Active' : 'Closed'}
        </span>
      </div>
      <div className="space-y-2">
        {options.map((opt) => {
          const votes = poll.votes?.filter((v) => v.optionId === opt.id).length || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              onClick={() => poll.isActive && onVote(poll.id, opt.id)}
              disabled={!poll.isActive}
              className="w-full text-left"
            >
              <div className="flex justify-between text-xs text-gray-300 mb-0.5">
                <span>{opt.text}</span>
                <span>{votes} ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
    </div>
  );
}
