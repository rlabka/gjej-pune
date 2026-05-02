'use client';

import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

type FeedbackToastProps = {
  message: string | null;
  onDismiss: () => void;
  /** Auto-dismiss duration in ms (default: 2200). */
  durationMs?: number;
};

export default function FeedbackToast({ message, onDismiss, durationMs = 2200 }: FeedbackToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => onDismiss(), durationMs);
    return () => window.clearTimeout(id);
  }, [message, onDismiss, durationMs]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white border border-slate-100 shadow-lg rounded-2xl px-4 py-3 flex items-start gap-3 max-w-[360px]">
        <div className="mt-0.5 text-green-600">
          <CheckCircle2 size={18} />
        </div>
        <p className="text-sm font-semibold text-[#162C66] leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

