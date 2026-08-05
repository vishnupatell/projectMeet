'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Video,
  Calendar,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronsLeft,
  ChevronsRight,
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'sticky top-0 flex h-screen flex-col border-r border-mist-200 bg-[linear-gradient(180deg,#0F2A33_0%,#0B404D_100%)] text-slate-100 shadow-glass transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      {/* Logo row with toggle */}
      {collapsed ? (
        <div className="border-b border-white/15 px-2 py-4 flex flex-col items-center gap-3">
          <Link href="/dashboard" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Video className="h-5 w-5 text-white" />
          </Link>
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/15 text-white"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-white/15 px-3 py-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              {APP_NAME}
            </span>
          </Link>
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/15 text-slate-300 hover:text-white"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const showBadge = item.key === 'meetings' && unseenCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center rounded-xl text-sm font-semibold transition-all',
                collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-white text-brand-700 shadow-card'
                  : 'text-slate-200/90 hover:bg-white/10 hover:text-white',
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="relative inline-flex flex-shrink-0">
                <Icon className="h-5 w-5" />
                {showBadge && collapsed && (
                  <span
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#0F2A33]"
                    aria-hidden
                  />
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {showBadge && (
                    <span
                      className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white"
                      aria-label={`${unseenCount} new invitation${unseenCount === 1 ? '' : 's'}`}
                    >
                      {unseenCount > 9 ? '9+' : unseenCount}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/15 px-2 py-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar name={user?.displayName || 'User'} src={user?.avatarUrl} size="sm" />
            <button
              onClick={() => dispatch(logoutRequest())}
              className="flex w-full justify-center rounded-xl p-2 text-slate-100 transition-colors hover:bg-red-500/20 hover:text-red-100"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1.5 flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2">
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
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-red-500/20 hover:text-red-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
