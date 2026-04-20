'use client';

import { Topbar } from '@/components/layout/Topbar';
import { useAppSelector } from '@/lib/hooks/useStore';
import { selectUser } from '@/store/selectors/authSelectors';
import { Avatar } from '@/components/ui/Avatar';
import { Mail, Shield, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const user = useAppSelector(selectUser);

  return (
    <div>
      <Topbar title="Settings" />

      <div className="mx-auto max-w-4xl p-6">
        {/* Profile Section */}
        <div className="surface-card overflow-hidden">
          <div className="h-28 bg-[linear-gradient(120deg,#0A3D4A_0%,#106F86_65%,#5AB8CA_100%)]" />
          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4">
              <Avatar
                name={user?.displayName || 'User'}
                src={user?.avatarUrl}
                size="xl"
                className="ring-4 ring-white"
              />
            </div>

            <h2 className="text-2xl font-bold text-ink-900">{user?.displayName}</h2>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-ink-700">
                <Mail className="h-4 w-4 text-brand-600" />
                {user?.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-700">
                <Shield className="h-4 w-4 text-brand-600" />
                Role: {user?.role}
              </div>
              {user?.createdAt && (
                <div className="flex items-center gap-3 text-sm text-ink-700">
                  <Calendar className="h-4 w-4 text-brand-600" />
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="surface-card mt-6 p-6">
          <h3 className="mb-4 text-lg font-bold text-ink-900">Preferences</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-mist-200 py-3">
              <div>
                <p className="font-semibold text-ink-800">Audio auto-mute</p>
                <p className="text-sm text-ink-400">Start meetings with microphone muted</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="h-6 w-11 rounded-full bg-mist-300 peer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-mist-300 after:bg-white after:transition-all after:content-[''] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-200 peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>

            <div className="flex items-center justify-between border-b border-mist-200 py-3">
              <div>
                <p className="font-semibold text-ink-800">Video auto-off</p>
                <p className="text-sm text-ink-400">Start meetings with camera off</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="h-6 w-11 rounded-full bg-mist-300 peer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-mist-300 after:bg-white after:transition-all after:content-[''] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-200 peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-ink-800">Notifications</p>
                <p className="text-sm text-ink-400">Receive meeting reminders and chat notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="h-6 w-11 rounded-full bg-mist-300 peer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-mist-300 after:bg-white after:transition-all after:content-[''] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-200 peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
