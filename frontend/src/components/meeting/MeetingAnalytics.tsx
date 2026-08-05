'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';
import { BarChart3, Clock, Users, Mic } from 'lucide-react';

interface AnalyticsData {
  totalDuration: number;
  peakParticipants: number;
  totalParticipants: number;
  speakingData: Record<string, number>;
  joinLeaveLog: { userId: string; action: string; timestamp: string }[];
  meeting?: { title: string; startedAt: string; endedAt: string; code: string };
}

export function MeetingAnalyticsPanel({ meetingId }: { meetingId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}/analytics/meeting/${meetingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [meetingId]);

  if (loading) return <div className="text-gray-400 text-center py-8 animate-pulse">Loading analytics...</div>;
  if (!data) return <div className="text-gray-500 text-center py-8">No analytics available</div>;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const speakingEntries = Object.entries(data.speakingData || {}).sort(([, a], [, b]) => b - a);
  const totalSpeaking = speakingEntries.reduce((sum, [, s]) => sum + s, 0);

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Meeting Analytics
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-white font-bold">{formatDuration(data.totalDuration)}</div>
          <div className="text-xs text-gray-400">Duration</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <Users className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-white font-bold">{data.peakParticipants}</div>
          <div className="text-xs text-gray-400">Peak</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <div className="text-white font-bold">{data.totalParticipants}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>

      {/* Speaking time */}
      {speakingEntries.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
            <Mic className="w-4 h-4" /> Speaking Time
          </h4>
          <div className="space-y-2">
            {speakingEntries.slice(0, 5).map(([userId, seconds]) => {
              const pct = totalSpeaking > 0 ? (seconds / totalSpeaking) * 100 : 0;
              return (
                <div key={userId}>
                  <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                    <span>{userId.slice(0, 8)}...</span>
                    <span>{formatDuration(seconds)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
