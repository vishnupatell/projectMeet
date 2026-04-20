'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Link as LinkIcon,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Keyboard,
  Copy,
  Check,
  ExternalLink,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/useStore';
import {
  fetchMeetingsRequest,
  createMeetingRequest,
  clearNewlyCreatedMeeting,
  clearMeetingError,
} from '@/store/slices/meetingSlice';
import {
  selectMeetings,
  selectMeetingLoading,
  selectNewlyCreatedMeeting,
  selectMeetingError,
} from '@/store/selectors/meetingSelectors';
import { selectUser } from '@/store/selectors/authSelectors';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { Meeting } from '@/types';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const meetings = useAppSelector(selectMeetings);
  const isLoading = useAppSelector(selectMeetingLoading);
  const newlyCreatedMeeting = useAppSelector(selectNewlyCreatedMeeting);
  const meetingError = useAppSelector(selectMeetingError);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const pendingActionRef = useRef<'instant' | 'scheduled' | null>(null);

  useEffect(() => {
    dispatch(fetchMeetingsRequest());
  }, [dispatch]);

  // Detect newly created meeting and react accordingly
  useEffect(() => {
    if (!newlyCreatedMeeting) return;

    if (pendingActionRef.current === 'instant') {
      dispatch(clearNewlyCreatedMeeting());
      pendingActionRef.current = null;
      router.push(`/meeting/${newlyCreatedMeeting.code}`);
    } else if (pendingActionRef.current === 'scheduled') {
      pendingActionRef.current = null;
      setShowCreatedModal(true);
    }
  }, [newlyCreatedMeeting, dispatch, router]);

  const handleCreateInstant = () => {
    const title = `${user?.displayName}'s Meeting`;
    pendingActionRef.current = 'instant';
    dispatch(createMeetingRequest({ title }));
  };

  const handleCreateScheduled = () => {
    if (!meetingTitle.trim()) return;
    pendingActionRef.current = 'scheduled';
    dispatch(createMeetingRequest({
      title: meetingTitle,
      description: meetingDescription || undefined,
      scheduledAt: scheduledAt || undefined,
    }));
    setShowCreateModal(false);
    setMeetingTitle('');
    setMeetingDescription('');
    setScheduledAt('');
  };

  const handleJoinMeeting = () => {
    if (!joinCode.trim()) return;
    router.push(`/meeting/${joinCode.trim()}`);
    setShowJoinModal(false);
    setJoinCode('');
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const getMeetingLink = (code: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/meeting/${code}` : `/meeting/${code}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'SCHEDULED': return 'border-brand-200 bg-brand-50 text-brand-700';
      case 'ENDED': return 'border-mist-300 bg-mist-100 text-ink-400';
      case 'CANCELLED': return 'border-red-200 bg-red-50 text-red-700';
      default: return 'border-mist-300 bg-mist-100 text-ink-400';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeMeetings = meetings.filter((m) => m.status === 'ACTIVE' || m.status === 'SCHEDULED');

  return (
    <div>
      <Topbar title="Dashboard" />

      <div className="mx-auto max-w-7xl p-6">
        {/* Error banner */}
        {meetingError && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{meetingError}</span>
            <button onClick={() => dispatch(clearMeetingError())} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">
            Welcome back, {user?.displayName?.split(' ')[0]} 👋
          </h2>
          <p className="mt-1 text-sm text-ink-400">Start or join a meeting to collaborate with your team.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={handleCreateInstant}
            disabled={isLoading}
            className="group flex items-center gap-4 rounded-2xl bg-brand-600 p-5 text-white shadow-soft transition-all duration-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="rounded-xl bg-brand-500 p-3 transition-colors group-hover:bg-brand-400">
              {isLoading && pendingActionRef.current === 'instant'
                ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Video className="h-6 w-6" />}
            </div>
            <div className="text-left">
              <p className="font-semibold">New Meeting</p>
              <p className="text-sm text-brand-100">Start instantly</p>
            </div>
          </button>

          <button
            onClick={() => setShowJoinModal(true)}
            className="surface-card group flex items-center gap-4 p-5 transition-all duration-200 hover:border-brand-200"
          >
            <div className="rounded-xl bg-brand-50 p-3 transition-colors group-hover:bg-brand-100">
              <Keyboard className="h-6 w-6 text-brand-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-ink-900">Join Meeting</p>
              <p className="text-sm text-ink-400">Enter a code</p>
            </div>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="surface-card group flex items-center gap-4 p-5 transition-all duration-200 hover:border-brand-200"
          >
            <div className="rounded-xl bg-emerald-50 p-3 transition-colors group-hover:bg-emerald-100">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-ink-900">Schedule</p>
              <p className="text-sm text-ink-400">Plan ahead</p>
            </div>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="surface-card group flex items-center gap-4 p-5 transition-all duration-200 hover:border-brand-200"
          >
            <div className="rounded-xl bg-cyan-50 p-3 transition-colors group-hover:bg-cyan-100">
              <LinkIcon className="h-6 w-6 text-cyan-700" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-ink-900">Share Link</p>
              <p className="text-sm text-ink-400">Invite others</p>
            </div>
          </button>
        </div>

        {/* Recent Meetings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-ink-900">Recent Meetings</h3>
            <Button variant="ghost" size="sm" onClick={() => router.push('/meetings')}>
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {isLoading && meetings.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="surface-card py-12 text-center">
              <Video className="mx-auto mb-3 h-12 w-12 text-mist-300" />
              <p className="font-semibold text-ink-700">No meetings yet</p>
              <p className="mt-1 text-sm text-ink-400">Create or join a meeting to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {meetings.slice(0, 5).map((meeting: Meeting) => (
                <div
                  key={meeting.id}
                  className="surface-card flex items-center justify-between p-4 transition-all duration-200 hover:border-brand-200"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0 rounded-xl bg-brand-50 p-2.5">
                      <Video className="h-5 w-5 text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-ink-900">{meeting.title}</h4>
                      <div className="mt-1 flex items-center gap-3 text-sm text-ink-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(meeting.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {meeting.participants?.length || 0}
                        </span>
                        <code className="rounded bg-mist-100 px-1.5 py-0.5 text-xs font-semibold text-ink-700">{meeting.code}</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                    <button
                      onClick={() => copyToClipboard(getMeetingLink(meeting.code), meeting.id)}
                      title="Copy meeting link"
                      className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                    >
                      {copiedCode === meeting.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    {(meeting.status === 'ACTIVE' || meeting.status === 'SCHEDULED') && (
                      <button
                        onClick={() => router.push(`/meeting/${meeting.code}`)}
                        title="Join meeting"
                        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Schedule a meeting">
        <div className="space-y-4">
          <Input
            label="Meeting title *"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="Team standup, Project review..."
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              Description (optional)
            </label>
            <textarea
              value={meetingDescription}
              onChange={(e) => setMeetingDescription(e.target.value)}
              placeholder="What's this meeting about?"
              rows={3}
              className="w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/70"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              Schedule for (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm text-ink-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/70"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateScheduled} className="flex-1" disabled={!meetingTitle.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create Meeting'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join Meeting Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join a meeting">
        <div className="space-y-4">
          <Input
            label="Meeting code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="abc-defg-hij"
            onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowJoinModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleJoinMeeting} className="flex-1" disabled={!joinCode.trim()}>
              Join
            </Button>
          </div>
        </div>
      </Modal>

      {/* Meeting Created Success Modal */}
      <Modal
        isOpen={showCreatedModal}
        onClose={() => {
          setShowCreatedModal(false);
          dispatch(clearNewlyCreatedMeeting());
        }}
        title="Meeting created! 🎉"
      >
        {newlyCreatedMeeting && (
          <div className="space-y-5">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-lg font-semibold text-emerald-800">{newlyCreatedMeeting.title}</p>
              {newlyCreatedMeeting.description && (
                <p className="mt-1 text-sm text-emerald-700">{newlyCreatedMeeting.description}</p>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-700">Meeting Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-mist-100 px-3 py-2 text-sm font-mono text-ink-800">
                  {newlyCreatedMeeting.code}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedMeeting.code, 'modal-code')}
                  className="flex items-center gap-1 rounded-lg bg-mist-150 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-mist-200"
                >
                  {copiedCode === 'modal-code' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  Copy
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-700">Meeting Link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 truncate rounded-lg bg-mist-100 px-3 py-2 font-mono text-xs text-ink-500">
                  {getMeetingLink(newlyCreatedMeeting.code)}
                </div>
                <button
                  onClick={() => copyToClipboard(getMeetingLink(newlyCreatedMeeting.code), 'modal-link')}
                  className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-mist-150 px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-mist-200"
                >
                  {copiedCode === 'modal-link' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  Copy
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreatedModal(false);
                  dispatch(clearNewlyCreatedMeeting());
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowCreatedModal(false);
                  dispatch(clearNewlyCreatedMeeting());
                  router.push(`/meeting/${newlyCreatedMeeting.code}`);
                }}
                className="flex-1"
              >
                Start Now
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Share Link Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share a meeting link">
        <div className="space-y-3">
          {activeMeetings.length === 0 ? (
            <div className="py-8 text-center text-ink-400">
              <LinkIcon className="mx-auto mb-3 h-10 w-10 text-mist-300" />
              <p>No active or scheduled meetings</p>
              <p className="text-sm mt-1">Create a meeting first to get a shareable link</p>
            </div>
          ) : (
            activeMeetings.map((meeting: Meeting) => (
              <div key={meeting.id} className="rounded-xl border border-mist-200 bg-mist-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-ink-900">{meeting.title}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(meeting.status)}`}>
                    {meeting.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded border border-mist-200 bg-white px-2.5 py-1.5 font-mono text-xs text-ink-700">
                    {getMeetingLink(meeting.code)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(getMeetingLink(meeting.code), `share-${meeting.id}`)}
                    className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-brand-700"
                  >
                    {copiedCode === `share-${meeting.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCode === `share-${meeting.id}` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
