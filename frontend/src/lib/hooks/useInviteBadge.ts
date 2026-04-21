'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from './useStore';
import { selectMeetings } from '@/store/selectors/meetingSelectors';
import { selectUser } from '@/store/selectors/authSelectors';
import type { Meeting } from '@/types';

const STORAGE_PREFIX = 'projectmeet.invitesSeenAt.';

function readSeenAt(userId: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(STORAGE_PREFIX + userId);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function writeSeenAt(userId: string, ts: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_PREFIX + userId, String(ts));
}

/**
 * Count meetings where the current user is an invitee (not the host) that are
 * still relevant (not ENDED/CANCELLED), and how many of those arrived after
 * the user last visited the Meetings page.
 */
export function useInviteBadge() {
  const meetings = useAppSelector(selectMeetings);
  const user = useAppSelector(selectUser);
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    setSeenAt(readSeenAt(user.id));
  }, [user?.id]);

  const relevantInvites = (meetings as Meeting[]).filter(
    (m) =>
      user?.id &&
      m.ownerId !== user.id &&
      m.status !== 'ENDED' &&
      m.status !== 'CANCELLED',
  );

  const unseenCount = relevantInvites.filter((m) => {
    const createdAt = m.createdAt ? new Date(m.createdAt).getTime() : 0;
    return createdAt > seenAt;
  }).length;

  const markSeen = useCallback(() => {
    if (!user?.id) return;
    const now = Date.now();
    writeSeenAt(user.id, now);
    setSeenAt(now);
  }, [user?.id]);

  return {
    totalInvites: relevantInvites.length,
    unseenCount,
    invites: relevantInvites,
    markSeen,
  };
}
