'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CandidateCard from './CandidateCard';
import PipelineColumn from './PipelineColumn';
import type { Applicant, PipelineStatus } from './types';
import { PIPELINE_STATUSES } from './types';
import type { CandidateAction } from './statusActions';
import { actionToNextStatus } from './statusActions';
import ConfirmModal from './ConfirmModal';
import ToastStack, { type ToastItem, type ToastVariant } from './ToastStack';
import BulkActionBar from './BulkActionBar';
import type { TimelineEvent } from './CandidateTimeline';

type Props = {
  applicants: Applicant[];
  query: string;
  setQuery: (value: string) => void;
  setApplicants: (updater: (prev: Applicant[]) => Applicant[]) => void;
  selectedStatuses: PipelineStatus[]; // empty => all
  jobFilter: Applicant['jobKey'] | 'all';
  focusMode: boolean;
  stageLabel: (status: PipelineStatus) => string;
  titleLabel: (key: Applicant['roleKey']) => string;
  jobLabel: (key: Applicant['jobKey']) => string;
  t: (key: string, values?: Record<string, any>) => string;
};

function isPipelineStatus(value: unknown): value is PipelineStatus {
  return typeof value === 'string' && (PIPELINE_STATUSES as readonly string[]).includes(value);
}

export default function PipelineBoard({
  applicants,
  query,
  setQuery,
  setApplicants,
  selectedStatuses,
  jobFilter,
  focusMode,
  stageLabel,
  titleLabel,
  jobLabel,
  t
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismissLabel = t('toast.dismiss');
  const timeoutByToastId = useRef(new Map<string, number>());

  const pushToast = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((prev) => [...prev, { id, variant, title, description }]);

      const timer = window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
        timeoutByToastId.current.delete(id);
      }, 3500);
      timeoutByToastId.current.set(id, timer);
    },
    [setToasts]
  );

  const dismissToast = useCallback((id: string) => {
    const timer = timeoutByToastId.current.get(id);
    if (timer) window.clearTimeout(timer);
    timeoutByToastId.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const [confirm, setConfirm] = useState<null | { kind: 'reject' | 'hire'; applicantId: number; fromStatus: PipelineStatus; toStatus: PipelineStatus }>(
    null
  );
  const [bulkConfirm, setBulkConfirm] = useState<null | { kind: 'reject' | 'hire'; status: 'REJECTED' | 'HIRED' }>(
    null
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<'SHORTLISTED' | 'INTERVIEW' | 'REJECTED' | 'HIRED'>('SHORTLISTED');
  const [timelineById, setTimelineById] = useState<Record<number, TimelineEvent[]>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const visibleStatuses = useMemo(() => {
    const base = focusMode ? (['SHORTLISTED', 'INTERVIEW'] as PipelineStatus[]) : PIPELINE_STATUSES;
    if (!selectedStatuses.length) return base;
    return base.filter((s) => selectedStatuses.includes(s));
  }, [focusMode, selectedStatuses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applicants.filter((a) => {
      if (!visibleStatuses.includes(a.status)) return false;
      if (jobFilter !== 'all' && a.jobKey !== jobFilter) return false;

      if (!q) return true;
      const role = titleLabel(a.roleKey).toLowerCase();
      const job = jobLabel(a.jobKey).toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        role.includes(q) ||
        job.includes(q)
      );
    });
  }, [applicants, jobFilter, jobLabel, query, titleLabel, visibleStatuses]);

  useEffect(() => {
    setIsUpdating(true);
    const timer = window.setTimeout(() => setIsUpdating(false), 180);
    return () => window.clearTimeout(timer);
  }, [focusMode, jobFilter, query, selectedStatuses.join('|')]);

  const formatNow = useCallback(() => {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
  }, []);

  const appendEvent = useCallback((applicantId: number, event: Omit<TimelineEvent, 'id'>) => {
    setTimelineById((prev) => {
      const existing = prev[applicantId] || [];
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      return { ...prev, [applicantId]: [...existing, { ...event, id }] };
    });
  }, []);

  useEffect(() => {
    setTimelineById((prev) => {
      let changed = false;
      const next: Record<number, TimelineEvent[]> = { ...prev };
      for (const a of applicants) {
        if (!next[a.id]) {
          changed = true;
          next[a.id] = [
            {
              id: `seed-${a.id}`,
              type: 'SUBMITTED',
              timestamp: a.appliedAt
            }
          ];
        }
      }
      return changed ? next : prev;
    });
  }, [applicants]);

  const visibleIds = useMemo(() => filtered.map((a) => a.id), [filtered]);
  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<number>();
      for (const id of prev) if (visibleIdSet.has(id)) next.add(id);
      return next;
    });
  }, [visibleIdSet]);

  const selectedCount = selectedIds.size;
  const hasQuery = query.trim().length > 0;
  const hasFilters = jobFilter !== 'all' || selectedStatuses.length > 0;
  const showNoResultsNotice = filtered.length === 0;

  const noResultsTitleKey = useMemo(() => {
    if (!showNoResultsNotice) return null;
    if (focusMode) return 'results.focusTitle';
    if (hasQuery) return 'results.searchTitle';
    if (hasFilters) return 'results.filtersTitle';
    return 'results.emptyTitle';
  }, [focusMode, hasFilters, hasQuery, showNoResultsNotice]);

  const noResultsDescKey = useMemo(() => {
    if (!showNoResultsNotice) return null;
    if (focusMode) return 'results.focusDesc';
    if (hasQuery) return 'results.searchDesc';
    if (hasFilters) return 'results.filtersDesc';
    return 'results.emptyDesc';
  }, [focusMode, hasFilters, hasQuery, showNoResultsNotice]);

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(visibleIds));
  }, [visibleIds]);

  const isEditableTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if (e.key === 'Escape') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          clearSelection();
        }
        return;
      }

      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        selectAllVisible();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearSelection, selectAllVisible, selectedIds.size]);

  const byStatus = useMemo(() => {
    const map = new Map<PipelineStatus, Applicant[]>();
    for (const s of visibleStatuses) map.set(s, []);
    for (const a of filtered) map.get(a.status)!.push(a);
    return map;
  }, [filtered, visibleStatuses]);

  const counts = useMemo(() => {
    const out = Object.fromEntries(visibleStatuses.map((s) => [s, 0])) as Record<PipelineStatus, number>;
    for (const a of filtered) out[a.status] += 1;
    return out;
  }, [filtered, visibleStatuses]);

  const stageOptions = useMemo(
    () => PIPELINE_STATUSES.map((s) => ({ value: s, label: stageLabel(s) })),
    [stageLabel]
  );

  const idToApplicant = useMemo(() => {
    const m = new Map<string, Applicant>();
    for (const a of applicants) m.set(String(a.id), a);
    return m;
  }, [applicants]);

  const moveToStatus = (id: number, status: PipelineStatus) => {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const getApplicantById = useCallback(
    (id: number) => applicants.find((a) => a.id === id) || null,
    [applicants]
  );

  const requestStatusChange = useCallback(
    (id: number, next: PipelineStatus) => {
      const a = getApplicantById(id);
      if (!a) return;
      if (a.status === 'HIRED') {
        pushToast('warning', t('toast.actionNotAllowedTitle'), t('toast.actionNotAllowedDesc'));
        return;
      }
      if (a.status === next) return;

      if (next === 'REJECTED') {
        setConfirm({ kind: 'reject', applicantId: id, fromStatus: a.status, toStatus: next });
        return;
      }
      if (next === 'HIRED') {
        setConfirm({ kind: 'hire', applicantId: id, fromStatus: a.status, toStatus: next });
        return;
      }

      moveToStatus(id, next);
      appendEvent(id, {
        type: 'STATUS_CHANGED',
        timestamp: formatNow(),
        actor: 'YOU',
        fromStatus: a.status,
        toStatus: next
      });
      pushToast(
        'success',
        t('toast.statusChangedTitle'),
        t('toast.statusChangedDesc', { status: stageLabel(next) })
      );
    },
    [appendEvent, formatNow, getApplicantById, moveToStatus, pushToast, stageLabel, t]
  );

  const handleAction = useCallback(
    (action: CandidateAction, id: number) => {
      const a = getApplicantById(id);
      if (!a) return;

      if (a.status === 'HIRED' && action !== 'VIEW_PROFILE') {
        pushToast('warning', t('toast.actionNotAllowedTitle'), t('toast.actionNotAllowedDesc'));
        return;
      }

      const next = actionToNextStatus(action);
      if (next) {
        requestStatusChange(id, next);
        return;
      }

      switch (action) {
        case 'VIEW_PROFILE':
          pushToast('info', t('toast.viewProfileTitle'), t('toast.viewProfileDesc'));
          return;
        case 'MESSAGE':
          pushToast('info', t('toast.messageTitle'), t('toast.messageDesc'));
          return;
        case 'SCHEDULE_INTERVIEW':
          appendEvent(id, { type: 'INTERVIEW_SCHEDULED', timestamp: formatNow(), actor: 'YOU' });
          pushToast('info', t('toast.scheduleTitle'), t('toast.scheduleDesc'));
          return;
      }
    },
    [appendEvent, formatNow, getApplicantById, pushToast, requestStatusChange, t]
  );

  const openMenu = useCallback(
    (_id: number) => {
      pushToast('info', t('toast.uiOnlyTitle'), t('toast.uiOnlyDesc'));
    },
    [pushToast, t]
  );

  const confirmData = useMemo(() => {
    if (!confirm) return null;
    const a = getApplicantById(confirm.applicantId);
    if (!a) return null;

    if (confirm.kind === 'reject') {
      return {
        title: t('confirm.rejectTitle'),
        description: t('confirm.rejectDesc', { name: a.name }),
        confirmLabel: t('confirm.rejectConfirm'),
        cancelLabel: t('confirm.cancel'),
        confirmVariant: 'outline' as const,
        confirmClassName: 'border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800',
        onConfirm: () => {
          moveToStatus(a.id, 'REJECTED');
          appendEvent(a.id, {
            type: 'STATUS_CHANGED',
            timestamp: formatNow(),
            actor: 'YOU',
            fromStatus: confirm.fromStatus,
            toStatus: 'REJECTED'
          });
          appendEvent(a.id, { type: 'REJECTED', timestamp: formatNow(), actor: 'YOU' });
          pushToast('danger', t('toast.rejectedTitle'), t('toast.rejectedDesc', { name: a.name }));
          setConfirm(null);
        }
      };
    }

    return {
      title: t('confirm.hireTitle'),
      description: t('confirm.hireDesc', { name: a.name }),
      confirmLabel: t('confirm.hireConfirm'),
      cancelLabel: t('confirm.cancel'),
      confirmVariant: 'primary' as const,
      confirmClassName: undefined,
      onConfirm: () => {
        moveToStatus(a.id, 'HIRED');
        appendEvent(a.id, {
          type: 'STATUS_CHANGED',
          timestamp: formatNow(),
          actor: 'YOU',
          fromStatus: confirm.fromStatus,
          toStatus: 'HIRED'
        });
        appendEvent(a.id, { type: 'HIRED', timestamp: formatNow(), actor: 'YOU' });
        pushToast('success', t('toast.hiredTitle'), t('toast.hiredDesc', { name: a.name }));
        setConfirm(null);
      }
    };
  }, [appendEvent, confirm, formatNow, getApplicantById, moveToStatus, pushToast, t]);

  const bulkConfirmData = useMemo(() => {
    if (!bulkConfirm) return null;
    const count = selectedIds.size;
    if (!count) return null;

    if (bulkConfirm.kind === 'reject') {
      return {
        title: t('bulk.confirm.rejectTitle', { count }),
        description: t('bulk.confirm.rejectDesc', { count }),
        confirmLabel: t('bulk.confirm.rejectConfirm'),
        cancelLabel: t('bulk.confirm.cancel'),
        confirmVariant: 'outline' as const,
        confirmClassName: 'border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800',
        onConfirm: () => {
          const ids = Array.from(selectedIds);
          const before = new Map<number, PipelineStatus>();
          for (const id of ids) {
            const a = getApplicantById(id);
            if (a) before.set(id, a.status);
          }

          setApplicants((prev) => prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: 'REJECTED' } : a)));

          for (const id of ids) {
            const from = before.get(id);
            if (!from || from === 'REJECTED') continue;
            appendEvent(id, {
              type: 'STATUS_CHANGED',
              timestamp: formatNow(),
              actor: 'YOU',
              fromStatus: from,
              toStatus: 'REJECTED'
            });
            appendEvent(id, { type: 'REJECTED', timestamp: formatNow(), actor: 'YOU' });
          }

          clearSelection();
          setBulkConfirm(null);
        }
      };
    }

    return {
      title: t('bulk.confirm.hireTitle', { count }),
      description: t('bulk.confirm.hireDesc', { count }),
      confirmLabel: t('bulk.confirm.hireConfirm'),
      cancelLabel: t('bulk.confirm.cancel'),
      confirmVariant: 'primary' as const,
      confirmClassName: undefined,
      onConfirm: () => {
        const ids = Array.from(selectedIds);
        const before = new Map<number, PipelineStatus>();
        for (const id of ids) {
          const a = getApplicantById(id);
          if (a) before.set(id, a.status);
        }

        setApplicants((prev) => prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: 'HIRED' } : a)));

        for (const id of ids) {
          const from = before.get(id);
          if (!from || from === 'HIRED') continue;
          appendEvent(id, {
            type: 'STATUS_CHANGED',
            timestamp: formatNow(),
            actor: 'YOU',
            fromStatus: from,
            toStatus: 'HIRED'
          });
          appendEvent(id, { type: 'HIRED', timestamp: formatNow(), actor: 'YOU' });
        }

        clearSelection();
        setBulkConfirm(null);
      }
    };
  }, [appendEvent, bulkConfirm, clearSelection, formatNow, getApplicantById, selectedIds, setApplicants, t]);

  const applyBulk = useCallback(() => {
    if (!selectedIds.size) return;
    if (bulkStatus === 'REJECTED') {
      setBulkConfirm({ kind: 'reject', status: 'REJECTED' });
      return;
    }
    if (bulkStatus === 'HIRED') {
      setBulkConfirm({ kind: 'hire', status: 'HIRED' });
      return;
    }
    const selected = Array.from(selectedIds);
    const before = new Map<number, PipelineStatus>();
    for (const id of selected) {
      const a = getApplicantById(id);
      if (a) before.set(id, a.status);
    }
    setApplicants((prev) => prev.map((a) => (selectedIds.has(a.id) ? { ...a, status: bulkStatus } : a)));
    for (const id of selected) {
      const from = before.get(id);
      if (!from || from === bulkStatus) continue;
      appendEvent(id, {
        type: 'STATUS_CHANGED',
        timestamp: formatNow(),
        actor: 'YOU',
        fromStatus: from,
        toStatus: bulkStatus
      });
    }
    clearSelection();
  }, [appendEvent, bulkStatus, clearSelection, formatNow, getApplicantById, selectedIds, setApplicants]);

  const canApplyBulk = useMemo(() => {
    if (!selectedIds.size) return false;
    for (const id of selectedIds) {
      const a = getApplicantById(id);
      if (!a) continue;
      if (a.status !== bulkStatus) return true;
    }
    return false;
  }, [bulkStatus, getApplicantById, selectedIds]);

  const addNote = useCallback(
    (id: number) => {
      appendEvent(id, { type: 'NOTE', timestamp: formatNow(), actor: 'YOU', note: t('timeline.noteExample') });
      pushToast('info', t('timeline.noteAddedTitle'), t('timeline.noteAddedDesc'));
    },
    [appendEvent, formatNow, pushToast, t]
  );

  const getContainerForId = (id: string): PipelineStatus | null => {
    const a = idToApplicant.get(id);
    return a ? a.status : null;
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // keep simple: we update onDragEnd only (no optimistic moves)
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeCandidate = idToApplicant.get(String(active.id));
    if (!activeCandidate) return;

    const overId = String(over.id);
    const fromStatus = activeCandidate.status;

    // Dropped on a column
    if (isPipelineStatus(over.id)) {
      const toStatus = over.id;
      if (toStatus !== fromStatus) {
        moveToStatus(activeCandidate.id, toStatus);
      }
      return;
    }

    // Dropped on another card -> move to that card's column and reorder within that column
    const overCandidate = idToApplicant.get(overId);
    if (!overCandidate) return;

    const toStatus = overCandidate.status;
    if (toStatus !== fromStatus) {
      moveToStatus(activeCandidate.id, toStatus);
      return;
    }

    // Reorder within the same column (based on filtered ordering)
    const container = getContainerForId(overId);
    if (!container) return;

    const itemsInColumn = (byStatus.get(container) || []).map((a) => String(a.id));
    const oldIndex = itemsInColumn.indexOf(String(active.id));
    const newIndex = itemsInColumn.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reorderedIds = arrayMove(itemsInColumn, oldIndex, newIndex);
    // Apply reorder to full applicants list by reconstructing order within this status
    setApplicants((prev) => {
      const inColumn = prev.filter((a) => a.status === container);
      const rest = prev.filter((a) => a.status !== container);
      const byId = new Map(inColumn.map((a) => [String(a.id), a]));
      const newInColumn = reorderedIds.map((id) => byId.get(id)!).filter(Boolean);
      return [...rest, ...newInColumn];
    });
  };

  return (
    <div className="space-y-8">
      <ToastStack items={toasts} onDismiss={dismissToast} dismissLabel={dismissLabel} />

      <ConfirmModal
        open={!!confirmData}
        title={confirmData?.title ?? ''}
        description={confirmData?.description ?? ''}
        confirmLabel={confirmData?.confirmLabel ?? ''}
        cancelLabel={confirmData?.cancelLabel ?? ''}
        confirmVariant={confirmData?.confirmVariant}
        confirmClassName={confirmData?.confirmClassName}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirmData?.onConfirm()}
      />

      <ConfirmModal
        open={!!bulkConfirmData}
        title={bulkConfirmData?.title ?? ''}
        description={bulkConfirmData?.description ?? ''}
        confirmLabel={bulkConfirmData?.confirmLabel ?? ''}
        cancelLabel={bulkConfirmData?.cancelLabel ?? ''}
        confirmVariant={bulkConfirmData?.confirmVariant}
        confirmClassName={bulkConfirmData?.confirmClassName}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => bulkConfirmData?.onConfirm()}
      />

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e: any) => setActiveId(String(e.active.id))}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={filtered.map((a) => String(a.id))}>
          <div className="space-y-6">
            {showNoResultsNotice && noResultsTitleKey && noResultsDescKey ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
                <div className="text-xl font-black text-[#162C66] mb-2">{t(noResultsTitleKey)}</div>
                <div className="text-sm font-medium text-slate-500 mb-4">{t(noResultsDescKey)}</div>
                <div className="text-xs font-bold text-slate-400">{t('results.ctaHint')}</div>
              </div>
            ) : null}

            <div className={isUpdating ? 'transition-opacity opacity-60' : 'transition-opacity opacity-100'}>
              {/* Board rail */}
              <div className="rounded-[28px] bg-[#F6F8FB] border border-slate-100 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {visibleStatuses.map((status) => {
                    const itemsInColumn = (byStatus.get(status) || []).map((a) => String(a.id));
                    const list = byStatus.get(status) || [];
                    return (
                      <div key={status} className="w-[360px] flex-shrink-0">
                        <PipelineColumn
                          status={status}
                          title={stageLabel(status)}
                          count={counts[status]}
                          itemIds={itemsInColumn}
                          emptyState={
                            <div className="px-4 py-6 text-center">
                              <div className="text-sm font-bold text-slate-400">{t(`empty.${status}`)}</div>
                              <div className="mt-1 text-xs font-medium text-slate-500">{t('empty.hint')}</div>
                            </div>
                          }
                        >
                          {list.map((a) => (
                            <CandidateCard
                              key={a.id}
                              applicant={a}
                              roleLabel={titleLabel(a.roleKey)}
                              jobLabel={jobLabel(a.jobKey)}
                              statusLabel={stageLabel(a.status)}
                              stageLabel={stageLabel}
                              selected={selectedIds.has(a.id)}
                              onToggleSelected={toggleSelected}
                              onRequestStatusChange={(id, next) => requestStatusChange(id, next)}
                              onAction={handleAction}
                              onOpenMenu={openMenu}
                              timelineEvents={timelineById[a.id] || []}
                              onAddNote={addNote}
                              stageOptions={stageOptions}
                            />
                          ))}
                        </PipelineColumn>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {selectedCount > 0 ? (
        <BulkActionBar
          selectedCount={selectedCount}
          statusValue={bulkStatus}
          setStatusValue={setBulkStatus}
          onApply={applyBulk}
          onClear={clearSelection}
          onSelectAllVisible={selectAllVisible}
          applyDisabled={!canApplyBulk}
          applyDisabledReason={t('bulk.applyDisabled')}
          t={t}
        />
      ) : null}
    </div>
  );
}
