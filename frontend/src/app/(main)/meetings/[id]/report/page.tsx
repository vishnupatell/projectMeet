'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/services/api';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';

interface Segment {
  start: number;
  end: number;
  text: string;
}

interface Transcript {
  id: string;
  recordingId: string;
  status: 'PENDING' | 'TRANSCRIBING' | 'SUMMARIZING' | 'READY' | 'FAILED';
  language: string | null;
  fullText: string | null;
  segments: Segment[] | null;
  summary: string | null;
  keyPoints: string[] | null;
  errorMsg: string | null;
  recording: {
    id: string;
    filename: string;
    startedAt: string;
    endedAt: string | null;
    duration: number;
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const statusLabel: Record<Transcript['status'], string> = {
  PENDING: 'Queued for processing',
  TRANSCRIBING: 'Transcribing audio...',
  SUMMARIZING: 'Generating summary...',
  READY: 'Ready',
  FAILED: 'Failed',
};

export default function MeetingReportPage() {
  const params = useParams<{ id: string }>();
  const meetingId = params.id;

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const loadTranscripts = useCallback(async () => {
    try {
      const res = await apiClient.getMeetingTranscripts(meetingId);
      setTranscripts(res.data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    loadTranscripts();
  }, [loadTranscripts]);

  useEffect(() => {
    const active = transcripts[activeIdx];
    if (!active) return;
    if (active.status === 'READY' || active.status === 'FAILED') return;

    const id = setInterval(loadTranscripts, 5000);
    return () => clearInterval(id);
  }, [transcripts, activeIdx, loadTranscripts]);

  const active = transcripts[activeIdx];

  const handleRegenerate = async () => {
    if (!active) return;
    try {
      await apiClient.generateTranscript(active.recordingId);
      await loadTranscripts();
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to regenerate');
    }
  };

  const handleSegmentClick = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const videoUrl = active ? apiClient.getRecordingDownloadUrl(active.recordingId) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 text-white">
      <Topbar />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to meetings
          </Link>
          {active && active.status === 'READY' && (
            <Button variant="secondary" onClick={handleRegenerate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          )}
        </div>

        <h1 className="mb-2 text-3xl font-bold">Meeting Report</h1>
        <p className="mb-8 text-white/60">
          Recording, transcript, and AI-generated summary of your meeting.
        </p>

        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading report...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-6">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {!loading && !error && transcripts.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-white/40" />
            <p className="text-white/70">
              No recording found for this meeting. Transcripts are generated automatically
              when a meeting is recorded.
            </p>
          </div>
        )}

        {!loading && !error && transcripts.length > 0 && active && (
          <>
            {transcripts.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {transcripts.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveIdx(idx)}
                    className={`rounded-lg px-4 py-2 text-sm transition ${
                      idx === activeIdx
                        ? 'bg-brand-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Recording {idx + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="aspect-video w-full"
                  >
                    <track kind="captions" />
                  </video>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock className="h-4 w-4" />
                    <span>
                      Recorded {new Date(active.recording.startedAt).toLocaleString()}
                    </span>
                  </div>
                  <a
                    href={videoUrl}
                    download
                    className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </div>

                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-400" />
                    <h2 className="text-xl font-semibold">AI Summary</h2>
                  </div>

                  {active.status !== 'READY' && active.status !== 'FAILED' && (
                    <div className="flex items-center gap-3 text-white/70">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{statusLabel[active.status]}</span>
                    </div>
                  )}

                  {active.status === 'FAILED' && (
                    <div className="flex items-start gap-3 text-red-300">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-medium">Processing failed</p>
                        <p className="text-sm text-red-300/80">{active.errorMsg}</p>
                        <Button variant="secondary" className="mt-3" onClick={handleRegenerate}>
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}

                  {active.status === 'READY' && (
                    <>
                      <p className="whitespace-pre-wrap leading-relaxed text-white/90">
                        {active.summary}
                      </p>

                      {active.keyPoints && active.keyPoints.length > 0 && (
                        <div className="mt-6">
                          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">
                            Key Points
                          </h3>
                          <ul className="space-y-2">
                            {active.keyPoints.map((kp, i) => (
                              <li key={i} className="flex gap-3 text-white/90">
                                <span className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                                <span>{kp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="sticky top-6 rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand-400" />
                    <h2 className="text-xl font-semibold">Transcript</h2>
                    {active.language && (
                      <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase text-white/70">
                        {active.language}
                      </span>
                    )}
                  </div>

                  {active.status !== 'READY' && (
                    <p className="text-sm text-white/60">{statusLabel[active.status]}</p>
                  )}

                  {active.status === 'READY' && active.segments && active.segments.length > 0 && (
                    <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-2">
                      {active.segments.map((seg, i) => (
                        <button
                          key={i}
                          onClick={() => handleSegmentClick(seg.start)}
                          className="w-full rounded-lg border border-transparent bg-white/0 p-3 text-left transition hover:border-white/10 hover:bg-white/5"
                        >
                          <div className="mb-1 text-xs text-brand-400">
                            {formatTime(seg.start)} – {formatTime(seg.end)}
                          </div>
                          <div className="text-sm text-white/90">{seg.text}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {active.status === 'READY' && (!active.segments || active.segments.length === 0) && (
                    <p className="text-sm text-white/60">No speech detected.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
