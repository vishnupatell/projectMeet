'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

export function MeetingTimer({ startTime }: { startTime: string | null }) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!startTime) return;

    const start = new Date(startTime).getTime();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const seconds = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-300 bg-gray-800/80 px-3 py-1.5 rounded-full">
      <Timer className="w-3.5 h-3.5 text-red-400" />
      <span className="font-mono">{elapsed}</span>
    </div>
  );
}
