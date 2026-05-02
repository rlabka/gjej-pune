'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { PipelineStatus } from './types';
import { clsx } from 'clsx';

type Props = {
  status: PipelineStatus;
  title: string;
  count: number;
  itemIds: string[];
  children: React.ReactNode;
  emptyState?: React.ReactNode;
};

export default function PipelineColumn({ status, title, count, itemIds, children, emptyState }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'column', status }
  });

  return (
    <div className="rounded-3xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 overflow-hidden flex flex-col h-full min-h-[520px]">
      {/* Column Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={clsx(
              'h-2 w-2 rounded-full',
              status === 'NEW' && 'bg-blue-500',
              status === 'IN_REVIEW' && 'bg-amber-400',
              status === 'SHORTLISTED' && 'bg-indigo-500',
              status === 'INTERVIEW' && 'bg-purple-500',
              status === 'HIRED' && 'bg-emerald-500',
              status === 'REJECTED' && 'bg-red-500'
            )}
            aria-hidden="true"
          />
          <h3 className="text-[12px] font-black tracking-widest text-slate-700 uppercase truncate">{title}</h3>
        </div>
        <span className="text-xs font-black text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full tabular-nums">
          {count}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 p-3 overflow-y-auto transition-colors',
          isOver ? 'bg-[#162C66]/[0.04]' : 'bg-slate-50/60'
        )}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">{children}</div>
        </SortableContext>

        {count === 0 && emptyState ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-10 text-center">
            {emptyState}
          </div>
        ) : null}
      </div>
    </div>
  );
}
