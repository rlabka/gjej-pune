import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'elevated' | 'glass';
  accent?: 'none' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
  default: 'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-slate-200/60',
  bordered: 'bg-white rounded-2xl border border-slate-200',
  elevated: 'bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100/80',
  glass: 'bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
};

const accentStyles = {
  none: '',
  primary: 'border-l-[3px] border-l-[#F5C400]',
  success: 'border-l-[3px] border-l-emerald-500',
  warning: 'border-l-[3px] border-l-amber-500',
  danger: 'border-l-[3px] border-l-red-500',
  info: 'border-l-[3px] border-l-blue-500',
};

export default function Card({ children, className, variant = 'default', accent = 'none' }: CardProps) {
  return (
    <div className={cn(
      'p-6 sm:p-8 transition-all duration-200',
      variantStyles[variant],
      accentStyles[accent],
      className
    )}>
      {children}
    </div>
  );
}
