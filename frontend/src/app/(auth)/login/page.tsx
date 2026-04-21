'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Video, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/useStore';
import { loginRequest, clearError } from '@/store/slices/authSlice';
import { selectIsAuthenticated, selectAuthLoading, selectAuthError } from '@/store/selectors/authSelectors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { APP_NAME } from '@/lib/config';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginRequest({ email, password }));
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center lg:hidden">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-soft">
          <Video className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-ink-900">{APP_NAME}</h1>
      </div>

      <div className="surface-card mt-4 p-7 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Welcome Back</p>
          <h2 className="mt-2 text-2xl font-bold text-ink-900">Sign in to {APP_NAME}</h2>
          <p className="mt-1 text-sm text-ink-400">Continue to your meetings, chat, and workspace.</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            required
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            icon={<Lock className="h-4 w-4" />}
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            icon={!isLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
          >
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-ink-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-600">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
