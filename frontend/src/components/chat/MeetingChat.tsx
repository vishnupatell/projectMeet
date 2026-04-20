'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/useStore';
import { selectMessages } from '@/store/selectors/chatSelectors';
import { selectUser } from '@/store/selectors/authSelectors';
import { fetchMessagesRequest } from '@/store/slices/chatSlice';
import { socketService } from '@/lib/services/socket';
import { Avatar } from '../ui/Avatar';
import type { Message } from '@/types';

interface MeetingChatProps {
  chatId: string;
}

export function MeetingChat({ chatId }: MeetingChatProps) {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectMessages(chatId));
  const user = useAppSelector(selectUser);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchMessagesRequest({ chatId }));
    socketService.emit('chat:join', { chatId });
  }, [chatId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    // Send via socket for real-time delivery
    socketService.emit('chat:message', { chatId, content: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#F9FCFD_0%,#EEF4F7_100%)]">
      {/* Header */}
      <div className="border-b border-mist-200 px-4 py-3">
        <h3 className="text-sm font-bold text-ink-900">Meeting Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {[...messages].reverse().map((msg: Message) => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
              {!isOwn && (
                <Avatar
                  name={msg.sender.displayName}
                  src={msg.sender.avatarUrl}
                  size="sm"
                />
              )}
              <div className={`max-w-[75%] ${isOwn ? 'text-right' : ''}`}>
                {!isOwn && (
                  <p className="mb-0.5 text-xs font-medium text-ink-400">{msg.sender.displayName}</p>
                )}
                <div
                  className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                    isOwn
                      ? 'rounded-tr-sm bg-brand-600 text-white'
                      : 'rounded-tl-sm border border-mist-200 bg-white text-ink-800'
                  }`}
                >
                  {msg.content}
                </div>
                <p className="mt-0.5 text-xs text-ink-400">{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-mist-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-mist-300 bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/70"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="rounded-xl bg-brand-600 p-2 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
