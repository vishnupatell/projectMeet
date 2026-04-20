import clsx from 'clsx';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const pixelSizes: Record<string, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={clsx(
          'rounded-full object-cover',
          sizes[size],
          className,
        )}
      />
    );
  }

  const colors = [
    'bg-brand-600',
    'bg-teal-600',
    'bg-cyan-600',
    'bg-emerald-600',
    'bg-sky-700',
    'bg-blue-700',
    'bg-indigo-700',
    'bg-slate-700',
  ];

  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold text-white',
        sizes[size],
        colors[colorIndex],
        className,
      )}
    >
      {initials}
    </div>
  );
}
