'use client';

import Button from '@/components/ui/Button';
import { Briefcase, Calendar, MapPin, MoreHorizontal, GripVertical, Activity, Star, FileText, Mail } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import type { Applicant, PipelineStatus } from './types';
import { useTranslations } from 'next-intl';
import type { CandidateAction } from './statusActions';
import { actionI18nKey, actionsForStatus } from './statusActions';
import CandidateTimeline, { type TimelineEvent } from './CandidateTimeline';

type Props = {
  applicant: Applicant;
  roleLabel: string;
  jobLabel: string;
  statusLabel: string;
  stageLabel: (status: PipelineStatus) => string;
  selected: boolean;
  onToggleSelected: (id: number) => void;
  onRequestStatusChange: (id: number, status: PipelineStatus) => void;
  onAction: (action: CandidateAction, id: number) => void;
  onOpenMenu: (id: number) => void;
  timelineEvents: TimelineEvent[];
  onAddNote: (id: number) => void;
  stageOptions: Array<{ value: PipelineStatus; label: string }>;
};

export default function CandidateCard({
  applicant,
  roleLabel,
  jobLabel,
  statusLabel,
  stageLabel,
  selected,
  onToggleSelected,
  onRequestStatusChange,
  onAction,
  onOpenMenu,
  timelineEvents,
  onAddNote,
  stageOptions
}: Props) {
  const t = useTranslations('EmployerApplications');
  const [timelineOpen, setTimelineOpen] = useState(false);

  const orderedEvents = useMemo(() => {
    return [...timelineEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [timelineEvents]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: String(applicant.id),
    data: { type: 'candidate', candidateId: applicant.id }
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative'
  };

  const primaryAction = useMemo(() => {
    const actions = actionsForStatus(applicant.status);
    // Determine the single primary action based on status logic
    if (applicant.status === 'NEW') return actions.find(a => a === 'VIEW_PROFILE');
    if (applicant.status === 'IN_REVIEW') return actions.find(a => a === 'SHORTLIST'); // "Weiter" -> Shortlist
    if (applicant.status === 'SHORTLISTED') return actions.find(a => a === 'MOVE_TO_INTERVIEW'); // "Zum Interview"
    if (applicant.status === 'INTERVIEW') return actions.find(a => a === 'HIRE'); // "Einstellen"
    if (applicant.status === 'HIRED') return actions.find(a => a === 'VIEW_PROFILE');
    if (applicant.status === 'REJECTED') return actions.find(a => a === 'RESTORE_TO_IN_REVIEW');
    return actions[0]; // Fallback
  }, [applicant.status]);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={clsx(
          'bg-white rounded-[20px] p-5 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.06)] border border-slate-100/60 hover:shadow-[0_12px_32px_-6px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 transition-all duration-300 group relative',
          selected && 'ring-2 ring-[#162C66]/30 ring-offset-2',
          isDragging && 'shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18)] rotate-1 cursor-grabbing'
        )}
      >
        {/* Selection Checkbox */}
        <div
          className={clsx(
            'absolute top-4 left-4 z-10 transition-opacity duration-200',
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelected(applicant.id);
            }}
            className="h-5 w-5 rounded-md border-slate-300 text-[#162C66] focus:ring-2 focus:ring-[#162C66]/20 cursor-pointer bg-white"
          />
        </div>

        {/* Header: Avatar | Name + Role | More */}
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              'h-12 w-12 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-100 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing',
              isDragging && 'cursor-grabbing'
            )}
            {...listeners}
            aria-label={t('pipeline.dragHandle')}
            title={t('pipeline.dragHandle')}
          >
            {applicant.img ? (
              <img src={applicant.img} alt={applicant.name} className="h-full w-full object-cover" />
            ) : (
              <GripVertical size={20} className="text-slate-400" />
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[16px] font-bold text-[#0B1F44] leading-tight truncate pr-2">
                  {applicant.name}
                </div>
                <div className="text-sm text-slate-500 font-medium truncate">{roleLabel}</div>
              </div>
              
              <button
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#162C66] hover:bg-slate-50 transition-colors -mr-2 -mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMenu(applicant.id);
                }}
                aria-label={t('pipeline.more')}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Meta Info: Single Line */}
        <div className="mt-3 text-xs font-medium text-slate-500 flex items-center gap-2 truncate">
          <span className="truncate">{applicant.location}</span>
          <span className="text-slate-300">•</span>
          <span className="truncate">{applicant.appliedAt}</span>
          <span className="text-slate-300">•</span>
          <span className="truncate text-[#162C66]">{jobLabel}</span>
        </div>

        {/* Footer: Actions */}
        <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
          {/* Icon Actions (Left) */}
          <div className="flex items-center gap-1">
            <button 
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#F5C400] hover:bg-amber-50 transition-colors"
              title="Vormerken"
              onClick={(e) => { e.stopPropagation(); onAction('SHORTLIST', applicant.id); }}
            >
              <Star size={18} />
            </button>
            <button 
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#162C66] hover:bg-slate-50 transition-colors"
              title="Notiz"
              onClick={(e) => { e.stopPropagation(); onAddNote(applicant.id); }}
            >
              <FileText size={18} />
            </button>
            <button 
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#162C66] hover:bg-slate-50 transition-colors"
              title="Nachricht"
              onClick={(e) => { e.stopPropagation(); onAction('MESSAGE', applicant.id); }}
            >
              <Mail size={18} />
            </button>
          </div>

          {/* Primary Action (Right) */}
          {primaryAction && (
            <Button
              variant={applicant.status === 'INTERVIEW' ? 'primary' : 'secondary'}
              size="sm"
              className="h-9 px-4 text-xs font-bold shadow-sm whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                onAction(primaryAction, applicant.id);
              }}
            >
              {t(actionI18nKey(primaryAction))}
            </Button>
          )}
        </div>
        
        {/* Timeline Overlay Toggle (Optional, maybe hidden in this clean design or via Note icon?) */}
        {/* Keeping it simple as requested, timeline access via Note icon or More menu conceptually */}
        <CandidateTimeline
          open={timelineOpen}
          events={orderedEvents}
          stageLabel={stageLabel}
          t={t}
          onAddNote={() => onAddNote(applicant.id)}
        />
      </div>
    </div>
  );
}
