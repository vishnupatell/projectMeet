import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold text-ink-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-xl border border-mist-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 placeholder:text-ink-400',
              'transition-colors duration-200',
              'focus:border-brand-400 focus:ring-2 focus:ring-brand-200/70 focus:outline-none',
              'disabled:bg-mist-100 disabled:text-ink-400',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
              icon && 'pl-10',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
