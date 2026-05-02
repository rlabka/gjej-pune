'use client';

import { useLocale } from 'next-intl';

const loadingText = {
  de: 'Wird geladen…',
  en: 'Loading…',
  fr: 'Chargement…',
  it: 'Caricamento…',
  sq: 'Duke u ngarkuar…',
} as const;

interface LoadingScreenProps {
  /** 'page' = fullscreen, 'section' = inline, 'inline' = minimal */
  variant?: 'page' | 'section' | 'inline';
  /** Override loading text */
  text?: string;
  /** Hide the text label */
  hideText?: boolean;
}

export default function LoadingScreen({ variant = 'section', text, hideText }: LoadingScreenProps) {
  const locale = useLocale() as keyof typeof loadingText;
  const label = text ?? loadingText[locale] ?? loadingText.de;

  const spinner = (
    <div className="relative">
      {/* Outer ring */}
      <div className="w-10 h-10 rounded-full border-[3px] border-slate-200/60" />
      {/* Spinning arc */}
      <div className="absolute inset-0 w-10 h-10 rounded-full border-[3px] border-transparent border-t-[#162C66] animate-spin" />
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-[#162C66] rounded-full animate-pulse" />
      </div>
    </div>
  );

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center py-8">
        {spinner}
        {!hideText && (
          <span className="ml-3 text-[13px] font-semibold text-slate-500">{label}</span>
        )}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {!hideText && (
            <p className="text-[13px] font-semibold text-slate-400 tracking-wide">{label}</p>
          )}
        </div>
      </div>
    );
  }

  // section (default)
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {spinner}
        {!hideText && (
          <p className="text-[13px] font-semibold text-slate-400 tracking-wide">{label}</p>
        )}
      </div>
    </div>
  );
}

/** Skeleton card for list loading states */
export function SkeletonCard({ lines = 3, avatar = true }: { lines?: number; avatar?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 animate-pulse">
      <div className="flex items-start gap-4">
        {avatar && <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 shrink-0" />}
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-100 rounded-lg w-2/5" />
          <div className="h-3.5 bg-slate-100/70 rounded-lg w-1/3" />
          {lines > 2 && <div className="h-3 bg-slate-50 rounded-lg w-3/5" />}
        </div>
      </div>
      <div className="flex gap-2.5 mt-5">
        <div className="h-7 bg-slate-100/80 rounded-lg w-20" />
        <div className="h-7 bg-slate-100/60 rounded-lg w-24" />
        <div className="h-7 bg-slate-100/40 rounded-lg w-16" />
      </div>
    </div>
  );
}

/** Multiple skeleton cards for list loading */
export function SkeletonList({ count = 3, avatar = true }: { count?: number; avatar?: boolean }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} avatar={avatar} />
      ))}
    </div>
  );
}
