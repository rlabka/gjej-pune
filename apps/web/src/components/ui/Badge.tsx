import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'blue';
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-[#162C66]',
  };

  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
}
