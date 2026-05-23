'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, X, Bot } from 'lucide-react';
import { apiClient } from '@/lib/services/api';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface MeetingAIAssistantProps {
  meetingId: string;
  onClose: () => void;
}

export function MeetingAIAssistant({ meetingId, onClose }: MeetingAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hi! I'm your meeting AI assistant. Ask me anything about what's been discussed — for example: \"What was discussed so far?\", \"Was my name mentioned?\", or \"Give me a quick summary.\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiClient.askMeeting(meetingId, q);
      const answer = res?.data?.answer || 'Sorry, I could not get an answer right now.';
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full w-80 flex-shrink-0 flex-col border-l border-white/10 bg-ink-900/95 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <span className="text-sm font-semibold text-white">AI Meeting Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'assistant' && (
              <div className="mt-0.5 flex-shrink-0 rounded-full bg-brand-500/20 p-1.5">
                <Bot className="h-3.5 w-3.5 text-brand-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-white/10 text-slate-100 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="mt-0.5 flex-shrink-0 rounded-full bg-brand-500/20 p-1.5">
              <Bot className="h-3.5 w-3.5 text-brand-400" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 focus-within:ring-1 focus-within:ring-brand-400">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the meeting…"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-lg p-1.5 text-brand-400 transition-colors hover:bg-brand-500/20 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-500">Powered by Whisper + Llama</p>
      </div>
    </div>
  );
}
