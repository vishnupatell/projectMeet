'use client';

import { useState, KeyboardEvent, ClipboardEvent } from 'react';
import { X, Mail } from 'lucide-react';

interface EmailChipInputProps {
  readonly label?: string;
  readonly emails: string[];
  readonly onChange: (emails: string[]) => void;
  readonly placeholder?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailChipInput({ label, emails, onChange, placeholder }: EmailChipInputProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addEmails = (raw: string) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (parts.length === 0) return true;

    const invalid = parts.find((p) => !EMAIL_REGEX.test(p));
    if (invalid) {
      setError(`"${invalid}" is not a valid email`);
      return false;
    }

    const next = Array.from(new Set([...emails, ...parts.map((p) => p.toLowerCase())]));
    onChange(next);
    setError(null);
    return true;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ' || e.key === 'Tab') {
      if (draft.trim()) {
        e.preventDefault();
        if (addEmails(draft)) setDraft('');
      }
    } else if (e.key === 'Backspace' && !draft && emails.length > 0) {
      onChange(emails.slice(0, -1));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (/[\s,;]/.test(text)) {
      e.preventDefault();
      if (addEmails(text)) setDraft('');
    }
  };

  const handleBlur = () => {
    if (draft.trim()) {
      if (addEmails(draft)) setDraft('');
    }
  };

  const removeAt = (idx: number) => {
    const next = emails.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-ink-700">{label}</label>
      )}
      <div
        className={`flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border bg-white px-3 py-2 transition-colors focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200/70 ${
          error ? 'border-red-500' : 'border-mist-300'
        }`}
      >
        <Mail className="h-4 w-4 text-ink-400" />
        {emails.map((email, idx) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
          >
            {email}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="rounded-full p-0.5 text-brand-600 hover:bg-brand-100"
              aria-label={`Remove ${email}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={emails.length === 0 ? placeholder || 'name@example.com' : ''}
          className="min-w-[160px] flex-1 bg-transparent text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none"
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-ink-400">
          Press Enter, comma, or space to add. Invitees will receive an email with the meeting link.
        </p>
      )}
    </div>
  );
}
