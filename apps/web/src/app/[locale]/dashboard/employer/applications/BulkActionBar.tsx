'use client';

import Button from '@/components/ui/Button';
import type { PipelineStatus } from './types';
import { CheckSquare, X, ChevronDown } from 'lucide-react';

type BulkStatusOption = Exclude<PipelineStatus, 'NEW' | 'IN_REVIEW'>;

type Props = {
  selectedCount: number;
  statusValue: BulkStatusOption;
  setStatusValue: (value: BulkStatusOption) => void;
  onApply: () => void;
  onClear: () => void;
  onSelectAllVisible: () => void;
  applyDisabled?: boolean;
  applyDisabledReason?: string;
  t: (key: string, values?: Record<string, any>) => string;
};

export default function BulkActionBar({
  selectedCount,
  statusValue,
  setStatusValue,
  onApply,
  onClear,
  onSelectAllVisible,
  applyDisabled,
  applyDisabledReason,
  t
}: Props) {
  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center animate-in slide-in-from-bottom-4 duration-300">
      <div className="pointer-events-auto bg-[#162C66] text-white p-3 pr-4 rounded-2xl shadow-[0_20px_60px_-10px_rgba(22,44,102,0.4)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border border-white/10 ring-1 ring-white/10 backdrop-blur-xl max-w-[90vw]">
        
        {/* Counter & Select All */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
            <CheckSquare size={16} className="text-[#F5C400]" />
            <span className="text-sm font-bold tracking-wide">
              {t('bulk.selectedCount', { count: selectedCount })}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10 hidden sm:block" />
          <button
            type="button"
            onClick={onSelectAllVisible}
            className="text-xs font-bold text-white/70 hover:text-white transition-colors underline decoration-white/30 hover:decoration-white decoration-2 underline-offset-2"
          >
            {t('bulk.selectAllVisible')}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <select
              id="bulk-status"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value as BulkStatusOption)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-[#F5C400] outline-none transition-all cursor-pointer hover:bg-white/20 [&>option]:text-[#162C66]"
            >
              <option value="SHORTLISTED">{t('bulk.status.shortlist')}</option>
              <option value="INTERVIEW">{t('bulk.status.interview')}</option>
              <option value="REJECTED">{t('bulk.status.reject')}</option>
              <option value="HIRED">{t('bulk.status.hire')}</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onApply}
            disabled={!!applyDisabled}
            title={applyDisabled ? applyDisabledReason : undefined}
            className="bg-[#F5C400] text-[#162C66] hover:bg-[#F5C400]/90 border-none font-black px-6 h-[42px] rounded-xl shadow-lg shadow-[#F5C400]/20"
          >
            {t('bulk.apply')}
          </Button>
          
          <button 
            onClick={onClear}
            className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            aria-label={t('bulk.clear')}
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
