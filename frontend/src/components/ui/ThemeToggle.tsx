'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { toggleTheme } from '@/store/slices/featuresSlice';
import { Sun, Moon } from 'lucide-react';
import { useEffect } from 'react';

export function ThemeToggle() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.features.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="p-2 rounded-lg border border-mist-200 bg-white hover:bg-mist-50 transition-colors shadow-sm"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-500" />
      ) : (
        <Moon className="w-4 h-4 text-ink-700" />
      )}
    </button>
  );
}
