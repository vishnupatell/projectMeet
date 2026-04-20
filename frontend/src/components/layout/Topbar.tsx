'use client';

import { Bell, Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAppSelector } from '@/lib/hooks/useStore';
import { selectUser } from '@/store/selectors/authSelectors';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const user = useAppSelector(selectUser);

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-mist-200/80 bg-white/75 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        {title && <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search meetings..."
            className="w-72 rounded-xl border border-mist-300 bg-mist-50 py-2.5 pl-10 pr-4 text-sm font-medium text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/70"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-xl border border-mist-200 bg-white p-2.5 transition-colors hover:bg-mist-50">
          <Bell className="h-5 w-5 text-ink-400" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 border-l border-mist-200 pl-3">
          <Avatar name={user?.displayName || 'User'} src={user?.avatarUrl} size="sm" />
          <span className="hidden text-sm font-semibold text-ink-700 lg:block">
            {user?.displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
