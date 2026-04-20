'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks/useStore';
import { restoreSession } from '@/store/slices/authSlice';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return <>{children}</>;
}
