'use client';

import { clsx } from 'clsx';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'danger';

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type Props = {
  items: ToastItem[];
  onDismiss: (id: string) => void;
  dismissLabel: string;
};

function variantStyles(variant: ToastVariant) {
  switch (variant) {
    case 'success':
      return { icon: CheckCircle2, ring: 'ring-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    case 'info':
      return { icon: Info, ring: 'ring-blue-200', bg: 'bg-blue-50', text: 'text-blue-700' };
    case 'warning':
      return { icon: AlertTriangle, ring: 'ring-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-800' };
    case 'danger':
      return { icon: XCircle, ring: 'ring-red-200', bg: 'bg-red-50', text: 'text-red-700' };
  }
}

export default function ToastStack({ items, onDismiss, dismissLabel }: Props) {
  if (!items.length) return null;

  return (
    <div className="fixed z-[60] top-5 right-5 space-y-3 w-[360px] max-w-[calc(100vw-40px)]">
      {items.map((t) => {
        const v = variantStyles(t.variant);
        const Icon = v.icon;
        return (
          <div
            key={t.id}
            className={clsx(
              'rounded-2xl shadow-lg border border-slate-100 ring-1 overflow-hidden',
              v.ring,
              v.bg
            )}
            role="status"
            aria-live="polite"
          >
            <div className="p-4 flex gap-3">
              <div className={clsx('mt-0.5', v.text)}>
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className={clsx('text-sm font-black truncate', v.text)}>{t.title}</div>
                    {t.description ? (
                      <div className="mt-0.5 text-xs font-medium text-slate-600">{t.description}</div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
                    aria-label={dismissLabel}
                    title={dismissLabel}
                    onClick={() => onDismiss(t.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

