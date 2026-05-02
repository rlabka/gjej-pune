'use client';

import Button from '@/components/ui/Button';
import { MoreHorizontal, User, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { Applicant, PipelineStatus } from './types';
import type { CandidateAction } from './statusActions';
import { actionI18nKey, actionsForStatus } from './statusActions';
import { useMemo, useState } from 'react';

type Props = {
  applicant: Applicant;
  roleLabel: string;
  jobLabel: string;
  statusLabel: string;
  stageLabel: (status: PipelineStatus) => string;
  selected: boolean;
  onToggleSelected: (id: number) => void;
  onAction: (action: CandidateAction, id: number) => void;
  onOpenMenu: (id: number) => void;
  onAddNote: (id: number) => void;
  t: (key: string, values?: Record<string, any>) => string;
};

export default function CandidateRow({
  applicant,
  roleLabel,
  jobLabel,
  statusLabel,
  stageLabel,
  selected,
  onToggleSelected,
  onAction,
  onOpenMenu,
  onAddNote,
  t
}: Props) {
  
  const statusStyles = useMemo(() => {
    switch (applicant.status) {
      case 'NEW': return 'bg-blue-50 text-blue-700';
      case 'IN_REVIEW': return 'bg-amber-50 text-amber-700';
      case 'SHORTLISTED': return 'bg-indigo-50 text-indigo-700';
      case 'INTERVIEW': return 'bg-purple-50 text-purple-700';
      case 'HIRED': return 'bg-emerald-50 text-emerald-700';
      case 'REJECTED': return 'bg-red-50 text-red-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  }, [applicant.status]);

  return (
    <div 
      className={clsx(
        "group flex items-center gap-4 p-4 bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors last:border-b-0",
        selected && "bg-[#162C66]/[0.02]"
      )}
    >
      {/* Left: Checkbox + Avatar + Name + Role */}
      <div className="flex items-center gap-4 min-w-0 flex-[2]">
        <div className="shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected(applicant.id)}
            className="h-5 w-5 rounded-md border-slate-300 text-[#162C66] focus:ring-2 focus:ring-[#162C66]/20 cursor-pointer"
          />
        </div>

        <div className="shrink-0">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-100">
            {applicant.img ? (
              <img src={applicant.img} alt={applicant.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold">
                {applicant.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="font-bold text-[#0B1F44] truncate text-[15px]">{applicant.name}</div>
          <div className="text-sm text-slate-500 truncate">{roleLabel}</div>
        </div>
      </div>

      {/* Middle: Meta-Infos (2 lines) */}
      <div className="hidden md:block flex-1 min-w-0">
        <div className="text-sm text-[#0B1F44] truncate font-medium">
          {applicant.location} <span className="text-slate-300 mx-1">·</span> {applicant.appliedAt}
        </div>
        <div className="text-sm text-slate-500 truncate mt-0.5">
          {jobLabel}
        </div>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center justify-end gap-3 flex-[1.5]">
        <span className={clsx(
          "px-3 h-6 flex items-center justify-center rounded-full text-xs font-bold whitespace-nowrap",
          statusStyles
        )}>
          {statusLabel}
        </span>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-100 ml-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-9 px-4 text-xs font-bold whitespace-nowrap hidden sm:flex"
            onClick={() => onAction('VIEW_PROFILE', applicant.id)}
          >
            {t('actions.viewProfile')}
          </Button>

          <button
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#162C66] transition-colors"
            onClick={() => onOpenMenu(applicant.id)}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
