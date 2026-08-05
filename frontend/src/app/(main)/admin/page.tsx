'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';
import { Users, Video, Database, Shield, Activity, BarChart3 } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalMeetings: number;
  activeMeetings: number;
  totalRecordings: number;
  totalMessages: number;
  storageUsedBytes: number;
}

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  role: string;
  createdAt: string;
  _count: { meetingsOwned: number; participants: number };
}

export default function AdminPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers }),
        fetch(`${API_URL}/admin/users`, { headers }),
      ]);
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      if (statsData.success) setStats(statsData.data);
      if (usersData.success) setUsers(usersData.data.users);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = async (userId: string) => {
    const token = localStorage.getItem('accessToken');
    await fetch(`${API_URL}/admin/users/${userId}/toggle-active`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          Admin Panel
        </h1>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats.totalUsers} sub={`${stats.activeUsers} active`} color="blue" />
            <StatCard icon={<Video className="w-6 h-6" />} label="Meetings" value={stats.totalMeetings} sub={`${stats.activeMeetings} active now`} color="green" />
            <StatCard icon={<Activity className="w-6 h-6" />} label="Recordings" value={stats.totalRecordings} sub={`${stats.totalMessages} messages`} color="purple" />
            <StatCard icon={<Database className="w-6 h-6" />} label="Storage Used" value={formatBytes(stats.storageUsedBytes)} color="orange" />
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 text-left text-sm text-gray-400">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Meetings</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-3 text-sm">{user.displayName}</td>
                    <td className="px-6 py-3 text-sm text-gray-400">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${user.role === 'ADMIN' ? 'bg-purple-600' : 'bg-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">{user._count.meetingsOwned}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`}>
                        {user.isActive ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggleUser(user.id)}
                        className={`text-xs px-3 py-1 rounded ${user.isActive ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                      >
                        {user.isActive ? 'Ban' : 'Unban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    green: 'bg-green-600/20 text-green-400 border-green-600/30',
    purple: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
    orange: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
