'use client';

import { clsx } from 'clsx';
import { PIPELINE_STATUSES, type PipelineStatus } from './types';

type Props = {
  activeTab: PipelineStatus | 'ALL';
  setActiveTab: (tab: PipelineStatus | 'ALL') => void;
  counts: Record<PipelineStatus, number>;
  stageLabel: (status: PipelineStatus) => string;
  t: (key: string) => string;
};

export default function PipelineTabs({ activeTab, setActiveTab, counts, stageLabel, t }: Props) {
  const tabs = ['ALL', ...PIPELINE_STATUSES] as const;

  return (
    <div className="border-b border-slate-200 mb-6 overflow-x-auto scroll-hint">
      <div className="flex gap-1 min-w-max px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'ALL' 
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : counts[tab as PipelineStatus];
            
          const label = tab === 'ALL' ? t('tabs.all') : stageLabel(tab as PipelineStatus);

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as PipelineStatus | 'ALL')}
              className={clsx(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all rounded-t-lg border-b-2',
                isActive 
                  ? 'text-[#162C66] border-[#162C66] bg-slate-50/50' 
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              {label}
              <span className={clsx(
                'px-1.5 py-0.5 rounded-md text-[10px] font-bold min-w-[20px] text-center',
                isActive ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-slate-500'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
