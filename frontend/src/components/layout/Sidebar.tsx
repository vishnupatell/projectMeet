'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Video,
  Calendar,
  Settings,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/useStore';
import { selectUser } from '@/store/selectors/authSelectors';
import { logoutRequest } from '@/store/slices/authSlice';
import { Avatar } from '../ui/Avatar';
import { APP_NAME } from '@/lib/config';
import { useInviteBadge } from '@/lib/hooks/useInviteBadge';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' as const },
  { href: '/meetings', label: 'Meetings', icon: Calendar, key: 'meetings' as const },
  { href: '/settings', label: 'Settings', icon: Settings, key: 'settings' as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const { unseenCount } = useInviteBadge();

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-mist-200 bg-[linear-gradient(180deg,#0F2A33_0%,#0B404D_100%)] text-slate-100 shadow-glass">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/15 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <Video className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">{APP_NAME}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const showBadge = item.key === 'meetings' && unseenCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-white text-brand-700 shadow-card'
                  : 'text-slate-200/90 hover:bg-white/10 hover:text-white',
              )}
            >
              <span className="relative inline-flex">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span
                    className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#0F2A33]"
                    aria-hidden
                  />
                )}
              </span>
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span
                  className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white"
                  aria-label={`${unseenCount} new invitation${unseenCount === 1 ? '' : 's'}`}
                >
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/15 px-4 py-4">
        <div className="mb-1 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5">
          <Avatar name={user?.displayName || 'User'} src={user?.avatarUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.displayName}
            </p>
            <p className="truncate text-xs text-slate-200/80">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(logoutRequest())}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-red-500/20 hover:text-red-100"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
