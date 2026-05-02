'use client';

import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  active:     { dot: 'bg-emerald-500', bg: 'bg-emerald-50/60', text: 'text-emerald-700', border: 'border-emerald-200/50' },
  hired:      { dot: 'bg-emerald-500', bg: 'bg-emerald-50/60', text: 'text-emerald-700', border: 'border-emerald-200/50' },
  pending:    { dot: 'bg-slate-400',   bg: 'bg-slate-50',      text: 'text-slate-500',   border: 'border-slate-200/50' },
  paused:     { dot: 'bg-amber-500',   bg: 'bg-amber-50/60',   text: 'text-amber-700',   border: 'border-amber-200/50' },
  'in review': { dot: 'bg-amber-500',  bg: 'bg-amber-50/60',   text: 'text-amber-700',   border: 'border-amber-200/50' },
  inreview:   { dot: 'bg-amber-500',   bg: 'bg-amber-50/60',   text: 'text-amber-700',   border: 'border-amber-200/50' },
  interview:  { dot: 'bg-blue-500',    bg: 'bg-blue-50/60',    text: 'text-blue-700',    border: 'border-blue-200/50' },
  shortlisted: { dot: 'bg-violet-500', bg: 'bg-violet-50/60',  text: 'text-violet-700',  border: 'border-violet-200/50' },
  new:        { dot: 'bg-blue-500',    bg: 'bg-blue-50/60',    text: 'text-blue-700',    border: 'border-blue-200/50' },
  closed:     { dot: 'bg-slate-400',   bg: 'bg-slate-50',      text: 'text-slate-500',   border: 'border-slate-200/50' },
  rejected:   { dot: 'bg-rose-500',    bg: 'bg-rose-50/60',    text: 'text-rose-700',    border: 'border-rose-200/50' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const t = useTranslations('Status');

  const statusKeyMap: Record<string, string> = {
    new: 'new', active: 'active', pending: 'pending', paused: 'paused',
    closed: 'closed', hired: 'hired', rejected: 'rejected', interview: 'interview',
    shortlisted: 'shortlisted', 'in review': 'inReview', 'in-review': 'inReview', inreview: 'inReview',
  };

  const key = statusKeyMap[normalizedStatus];
  const label = key ? t(key) : status;
  const style = statusStyles[normalizedStatus] || { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200/50' };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap border',
      style.bg, style.text, style.border
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} />
      {label}
    </span>
  );
}
