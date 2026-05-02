'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  confirmClassName?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'primary',
  confirmClassName,
  onConfirm,
  onClose
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0B1F44]/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        <Card className="p-0 overflow-hidden shadow-2xl ring-1 ring-black/5">
          <div className="p-6 pb-0 flex items-start justify-between gap-6">
            <div className="flex gap-4">
              <div className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                confirmVariant === 'outline' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
              )}>
                {confirmVariant === 'outline' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#162C66]">{title}</h3>
                <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">{description}</p>
              </div>
            </div>
            <button
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all -mr-2 -mt-2"
              aria-label={cancelLabel}
              title={cancelLabel}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 pt-8 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            >
              {cancelLabel}
            </Button>
            <Button 
              type="button" 
              variant={confirmVariant} 
              className={clsx("font-bold shadow-lg", confirmClassName)} 
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
