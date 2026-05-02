'use client';

import { useState } from 'react';
import type { Applicant, PipelineStatus } from './types';
import CandidateRow from './CandidateRow';
import type { CandidateAction } from './statusActions';

type Props = {
  applicants: Applicant[];
  selectedIds: Set<number>;
  onToggleSelected: (id: number) => void;
  onSelectAll: () => void;
  onAction: (action: CandidateAction, id: number) => void;
  onOpenMenu: (id: number) => void;
  onAddNote: (id: number) => void;
  stageLabel: (status: PipelineStatus) => string;
  titleLabel: (key: Applicant['roleKey']) => string;
  jobLabel: (key: Applicant['jobKey']) => string;
  t: (key: string, values?: Record<string, any>) => string;
};

export default function PipelineList({
  applicants,
  selectedIds,
  onToggleSelected,
  onSelectAll,
  onAction,
  onOpenMenu,
  onAddNote,
  stageLabel,
  titleLabel,
  jobLabel,
  t
}: Props) {
  
  if (applicants.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
        <div className="text-slate-400 font-medium">{t('empty.hint')}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
      {/* Optional: Minimal Header for Select All if needed, but 'Recruiting List' usually just lists items. 
          We can add a 'Select All' in the filter bar or just keep it simple. 
          Let's keep a very subtle header just for 'Select All' to be functional. */}
      {applicants.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center">
          <div className="flex items-center gap-3">
             <input
              type="checkbox"
              checked={selectedIds.size === applicants.length}
              onChange={onSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-[#162C66] focus:ring-2 focus:ring-[#162C66]/20 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedIds.size > 0 ? t('bulk.selectedCount', { count: selectedIds.size }) : t('bulk.selectAllVisible')}
            </span>
          </div>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {applicants.map((applicant) => (
          <CandidateRow
            key={applicant.id}
            applicant={applicant}
            roleLabel={titleLabel(applicant.roleKey)}
            jobLabel={jobLabel(applicant.jobKey)}
            statusLabel={stageLabel(applicant.status)}
            stageLabel={stageLabel}
            selected={selectedIds.has(applicant.id)}
            onToggleSelected={onToggleSelected}
            onAction={onAction}
            onOpenMenu={onOpenMenu}
            onAddNote={onAddNote}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
