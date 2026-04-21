import type { Meeting } from '@/types';

export type DerivedStatus = 'LIVE' | 'UPCOMING' | 'READY' | 'ENDED' | 'CANCELLED';

export interface MeetingStatusInfo {
  derived: DerivedStatus;
  label: string;
  /** Time until the scheduled start, in ms. Negative if already past. Null if not scheduled. */
  msUntilStart: number | null;
}

/**
 * Derive a user-facing status that accounts for scheduled time vs. now.
 * - SCHEDULED + future scheduledAt  → UPCOMING
 * - SCHEDULED + past/no scheduledAt → READY (joinable, not yet active)
 * - ACTIVE                          → LIVE
 * - ENDED / CANCELLED               → passthrough
 */
export function getMeetingStatus(meeting: Meeting, now: number = Date.now()): MeetingStatusInfo {
  if (meeting.status === 'ENDED') return { derived: 'ENDED', label: 'Ended', msUntilStart: null };
  if (meeting.status === 'CANCELLED') return { derived: 'CANCELLED', label: 'Cancelled', msUntilStart: null };
  if (meeting.status === 'ACTIVE') return { derived: 'LIVE', label: 'Live now', msUntilStart: null };

  const scheduledAt = meeting.scheduledAt ? new Date(meeting.scheduledAt).getTime() : null;
  if (scheduledAt && scheduledAt > now) {
    return { derived: 'UPCOMING', label: 'Upcoming', msUntilStart: scheduledAt - now };
  }
  return { derived: 'READY', label: 'Ready to start', msUntilStart: scheduledAt ? scheduledAt - now : null };
}

/** Format ms as "in 2d 3h", "in 15m", "in 45s". */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'now';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  if (minutes > 0) return `in ${minutes}m`;
  return `in ${seconds}s`;
}

export function statusBadgeClasses(derived: DerivedStatus): string {
  switch (derived) {
    case 'LIVE':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'READY':
      return 'border-brand-200 bg-brand-50 text-brand-700';
    case 'UPCOMING':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'ENDED':
      return 'border-mist-300 bg-mist-100 text-ink-400';
    case 'CANCELLED':
      return 'border-red-200 bg-red-50 text-red-700';
  }
}
