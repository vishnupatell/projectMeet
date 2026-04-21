'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Clock,
  Users,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  FileText,
  StopCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  X,
  Lock,
  Mail,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/useStore';
import {
  fetchMeetingsRequest,
  endMeetingRequest,
  deleteMeetingRequest,
  clearMeetingError,
} from '@/store/slices/meetingSlice';
import {
  selectMeetings,
  selectMeetingLoading,
  selectMeetingError,
} from '@/store/selectors/meetingSelectors';
import { selectUser } from '@/store/selectors/authSelectors';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  getMeetingStatus,
  formatCountdown,
  statusBadgeClasses,
  type DerivedStatus,
} from '@/lib/meetingStatus';
import { useNow } from '@/lib/hooks/useNow';
import { useInviteBadge } from '@/lib/hooks/useInviteBadge';
import type { Meeting } from '@/types';

export default function MeetingsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const meetings = useAppSelector(selectMeetings);
  const isLoading = useAppSelector(selectMeetingLoading);
  const meetingError = useAppSelector(selectMeetingError);
  const user = useAppSelector(selectUser);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmEndId, setConfirmEndId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DerivedStatus | 'ALL' | 'INVITED'>('ALL');

  const now = useNow(30_000);
  const { markSeen } = useInviteBadge();

  useEffect(() => {
    dispatch(fetchMeetingsRequest());
  }, [dispatch]);

  // Clear the "new invites" badge once the user visits this page.
  useEffect(() => {
    markSeen();
  }, [markSeen]);

  const getMeetingLink = (code: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/meeting/${code}` : `/meeting/${code}`;

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const handleEndMeeting = (meeting: Meeting) => {
    dispatch(endMeetingRequest(meeting.id));
    setConfirmEndId(null);
    setTimeout(() => dispatch(fetchMeetingsRequest()), 1500);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    dispatch(deleteMeetingRequest(meetingId));
    setConfirmDeleteId(null);
  };

  const decorated = meetings.map((m) => ({
    meeting: m,
    status: getMeetingStatus(m, now),
    isHost: m.ownerId === user?.id,
  }));

  const counts = {
    ALL: decorated.length,
    LIVE: decorated.filter((d) => d.status.derived === 'LIVE').length,
    UPCOMING: decorated.filter((d) => d.status.derived === 'UPCOMING').length,
    READY: decorated.filter((d) => d.status.derived === 'READY').length,
    ENDED: decorated.filter((d) => d.status.derived === 'ENDED').length,
    INVITED: decorated.filter((d) => !d.isHost).length,
  };

  const filtered = decorated.filter((d) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'INVITED') return !d.isHost;
    return d.status.derived === filterStatus;
  });

  const statusFilters: { key: typeof filterStatus; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: counts.ALL },
    { key: 'LIVE', label: 'Live', count: counts.LIVE },
    { key: 'UPCOMING', label: 'Upcoming', count: counts.UPCOMING },
    { key: 'READY', label: 'Ready', count: counts.READY },
    { key: 'INVITED', label: 'Invited to me', count: counts.INVITED },
    { key: 'ENDED', label: 'Ended', count: counts.ENDED },
  ];

  return (
    <div>
      <Topbar title="My Meetings" />
      <div className="mx-auto max-w-5xl p-6">
        {meetingError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{meetingError}</span>
            <button onClick={() => dispatch(clearMeetingError())} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {statusFilters.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors ${
                filterStatus === s.key
                  ? 'bg-brand-600 text-white'
                  : 'border border-mist-300 bg-white text-ink-500 hover:border-brand-200'
              }`}
            >
              {s.label} ({s.count})
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={() => dispatch(fetchMeetingsRequest())} className="ml-auto">
            Refresh
          </Button>
        </div>

        {isLoading && meetings.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            {filterStatus === 'INVITED' ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
                  <Mail className="h-8 w-8 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-ink-700">No invitations yet</h3>
                <p className="mt-1 text-ink-400">
                  When someone invites you to a meeting, it will show up here automatically.
                </p>
              </>
            ) : (
              <>
                <Calendar className="mx-auto mb-4 h-16 w-16 text-mist-300" />
                <h3 className="text-lg font-bold text-ink-700">No meetings found</h3>
                <p className="mt-1 text-ink-400">
                  {filterStatus === 'ALL'
                    ? 'Meetings you create or join will appear here'
                    : `No ${String(filterStatus).toLowerCase()} meetings`}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ meeting, status, isHost }) => {
              const isExpanded = expandedId === meeting.id;
              // Hosts can always start/join a SCHEDULED meeting (override the gate).
              // Non-hosts must wait until the scheduled time.
              const isLocked = status.derived === 'UPCOMING' && !isHost;
              const canJoin = status.derived === 'LIVE' || status.derived === 'READY' || (status.derived === 'UPCOMING' && isHost);
              const canEnd = status.derived === 'LIVE' && isHost;
              const joinLabel = status.derived === 'LIVE' ? 'Join' : 'Start';

              return (
                <div key={meeting.id} className="surface-card overflow-hidden transition-shadow">
                  <div className="flex items-center gap-4 p-5">
                    <div className="flex-shrink-0 rounded-xl bg-brand-50 p-3">
                      <Video className="h-6 w-6 text-brand-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="truncate font-semibold text-ink-900">{meeting.title}</h4>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClasses(status.derived)}`}>
                          {status.label}
                          {status.derived === 'UPCOMING' && status.msUntilStart != null && (
                            <span className="ml-1 font-normal">· {formatCountdown(status.msUntilStart)}</span>
                          )}
                        </span>
                        {isHost ? (
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700">Host</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                            <Mail className="h-3 w-3" /> Invited
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-ink-400">
                        {meeting.scheduledAt ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />Scheduled {formatDate(meeting.scheduledAt)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDate(meeting.createdAt)}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />{meeting.participants?.length || 0} participant{(meeting.participants?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        {!isHost && meeting.owner?.displayName && (
                          <span className="text-ink-500">Invited by <span className="font-semibold text-ink-700">{meeting.owner.displayName}</span></span>
                        )}
                        <code className="rounded bg-mist-100 px-1.5 py-0.5 font-mono text-xs text-ink-700">{meeting.code}</code>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => copyToClipboard(getMeetingLink(meeting.code), meeting.id)}
                        title="Copy meeting link"
                        className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                      >
                        {copiedId === meeting.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                      {canJoin && (
                        <button
                          onClick={() => router.push(`/meeting/${meeting.code}`)}
                          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {joinLabel}
                        </button>
                      )}
                      {isLocked && (
                        <button
                          disabled
                          title={`Available ${status.msUntilStart != null ? formatCountdown(status.msUntilStart) : 'soon'}`}
                          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-mist-300 bg-mist-100 px-3 py-1.5 text-sm font-semibold text-ink-400"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          {status.msUntilStart != null ? formatCountdown(status.msUntilStart) : 'Locked'}
                        </button>
                      )}
                      {canEnd && (
                        <button
                          onClick={() => setConfirmEndId(meeting.id)}
                          title="End meeting"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <StopCircle className="h-4 w-4" />
                        </button>
                      )}
                      {status.derived === 'ENDED' && (
                        <button
                          onClick={() => router.push(`/meetings/${meeting.id}/report`)}
                          title="View meeting report"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                      {isHost && (status.derived === 'ENDED' || status.derived === 'CANCELLED') && (
                        <button
                          onClick={() => setConfirmDeleteId(meeting.id)}
                          title="Delete meeting"
                          className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                        className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-mist-100 hover:text-ink-700"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-4 border-t border-mist-200 bg-mist-50 px-5 py-4">
                      {meeting.description && (
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Description</p>
                          <p className="text-sm text-ink-700">{meeting.description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Meeting Link</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 truncate rounded border border-mist-200 bg-white px-2.5 py-1.5 font-mono text-xs text-ink-700">
                              {getMeetingLink(meeting.code)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(getMeetingLink(meeting.code), `exp-${meeting.id}`)}
                              className="flex flex-shrink-0 items-center gap-1 rounded bg-brand-600 px-2 py-1.5 text-xs text-white transition-colors hover:bg-brand-700"
                            >
                              {copiedId === `exp-${meeting.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copiedId === `exp-${meeting.id}` ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Details</p>
                          <div className="space-y-1 text-xs text-ink-600">
                            <p>Max participants: {meeting.maxParticipants}</p>
                            {meeting.scheduledAt && <p>Scheduled: {formatDate(meeting.scheduledAt)}</p>}
                            {meeting.startedAt && <p>Started: {formatDate(meeting.startedAt)}</p>}
                            {meeting.endedAt && <p>Ended: {formatDate(meeting.endedAt)}</p>}
                          </div>
                        </div>
                      </div>
                      {meeting.participants && meeting.participants.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Participants</p>
                          <div className="flex flex-wrap gap-2">
                            {meeting.participants.map((p) => (
                              <div key={p.id} className="flex items-center gap-1.5 rounded-full border border-mist-200 bg-white px-3 py-1 text-xs text-ink-700">
                                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 font-bold text-white" style={{ fontSize: '8px' }}>
                                  {p.user?.displayName?.[0]?.toUpperCase() || '?'}
                                </div>
                                {p.user?.displayName || 'Unknown'}
                                <span className="text-ink-400">({p.role})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={!!confirmEndId} onClose={() => setConfirmEndId(null)} title="End this meeting?">
        <div className="space-y-4">
          <p className="text-sm text-ink-500">This will end the meeting for all participants. This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setConfirmEndId(null)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => { const m = meetings.find((m) => m.id === confirmEndId); if (m) handleEndMeeting(m); }}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >End Meeting</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete this meeting?">
        <div className="space-y-4">
          <p className="text-sm text-ink-500">This will permanently remove the meeting from your list.</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="flex-1">Cancel</Button>
            <Button onClick={() => handleDeleteMeeting(confirmDeleteId!)} className="flex-1 bg-red-600 hover:bg-red-700">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
