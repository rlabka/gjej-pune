'use client';

import type { PipelineStatus } from './types';
import { clsx } from 'clsx';
import { Clock, CheckCircle2, XCircle, Calendar, FileText, User } from 'lucide-react';

export type TimelineEventType =
  | 'SUBMITTED'
  | 'STATUS_CHANGED'
  | 'INTERVIEW_SCHEDULED'
  | 'HIRED'
  | 'REJECTED'
  | 'NOTE';

export type TimelineActor = 'YOU';

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  actor?: TimelineActor;
  fromStatus?: PipelineStatus;
  toStatus?: PipelineStatus;
  note?: string;
};

type Props = {
  open: boolean;
  events: TimelineEvent[];
  stageLabel: (status: PipelineStatus) => string;
  t: (key: string, values?: Record<string, any>) => string;
  onAddNote?: () => void;
};

function labelForEvent(
  e: TimelineEvent,
  stageLabel: (status: PipelineStatus) => string,
  t: (key: string, values?: Record<string, any>) => string
) {
  switch (e.type) {
    case 'SUBMITTED':
      return t('timeline.events.submitted');
    case 'STATUS_CHANGED':
      return t('timeline.events.statusChanged', {
        from: e.fromStatus ? stageLabel(e.fromStatus) : '',
        to: e.toStatus ? stageLabel(e.toStatus) : ''
      });
    case 'INTERVIEW_SCHEDULED':
      return t('timeline.events.interviewScheduled');
    case 'HIRED':
      return t('timeline.events.hired');
    case 'REJECTED':
      return t('timeline.events.rejected');
    case 'NOTE':
      return t('timeline.events.note');
  }
}

function getEventIcon(type: TimelineEventType) {
  switch (type) {
    case 'SUBMITTED': return Clock;
    case 'STATUS_CHANGED': return CheckCircle2;
    case 'INTERVIEW_SCHEDULED': return Calendar;
    case 'HIRED': return CheckCircle2;
    case 'REJECTED': return XCircle;
    case 'NOTE': return FileText;
    default: return CheckCircle2;
  }
}

export default function CandidateTimeline({ open, events, stageLabel, t, onAddNote }: Props) {
  if (!open) return null;

  return (
    <div className="mt-5 pt-5 border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t('timeline.title')}</div>
        {onAddNote ? (
          <button
            type="button"
            className="text-xs font-bold text-[#162C66] hover:text-[#0B1F44] hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
            onClick={onAddNote}
          >
            {t('timeline.addNote')}
          </button>
        ) : null}
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
          <div className="text-sm font-medium text-slate-500">{t('timeline.empty')}</div>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <ol className="relative border-l-2 border-slate-100 ml-3 space-y-6 pb-2">
            {events.map((e) => {
              const Icon = getEventIcon(e.type);
              return (
                <li key={e.id} className="relative pl-6">
                  <span
                    className={clsx(
                      'absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ring-1 ring-slate-100',
                      e.type === 'REJECTED' ? 'bg-red-500' :
                      e.type === 'HIRED' ? 'bg-emerald-500' :
                      e.type === 'INTERVIEW_SCHEDULED' ? 'bg-amber-400' :
                      e.type === 'NOTE' ? 'bg-indigo-400' :
                      'bg-blue-500'
                    )}
                  />

                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-bold text-[#162C66] leading-tight">
                        {labelForEvent(e, stageLabel, t)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap tabular-nums">
                        {e.timestamp}
                      </div>
                    </div>
                    
                    {e.note ? (
                      <div className="mt-1.5 p-3 bg-slate-50 rounded-lg text-xs font-medium text-slate-600 border border-slate-100 italic">
                        "{e.note}"
                      </div>
                    ) : null}
                    
                    {e.actor ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <User size={10} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {e.actor === 'YOU' ? t('timeline.actorYou') : e.actor}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
