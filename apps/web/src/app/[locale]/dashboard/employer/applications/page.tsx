'use client';

export const dynamic = 'force-dynamic';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Users, FileText, CheckCircle, XCircle,
  Search, MoreHorizontal, Eye, UserCheck,
  Ban, MessageSquare, CalendarCheck, RotateCcw, Star,
  MapPin, Calendar, Download, Inbox
} from 'lucide-react';
import type { Applicant, PipelineStatus } from './types';
import { statusToStageKey, PIPELINE_STATUSES } from './types';
import { actionsForStatus, actionToNextStatus, actionI18nKey } from './statusActions';
import type { CandidateAction } from './statusActions';
import ToastStack, { type ToastItem, type ToastVariant } from './ToastStack';
import ConfirmModal from './ConfirmModal';

/* ─── Mock data ──────────────────────────────────────────────────────── */

const INITIAL_APPLICANTS: Applicant[] = [
  { id: 1, name: 'Alex Johnson', roleKey: 'seniorFrontendEngineer', jobKey: 'seniorFrontendEngineer', location: 'Zürich', status: 'IN_REVIEW', appliedAt: 'Jan 28, 2026', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
  { id: 2, name: 'Sarah Miller', roleKey: 'productDesigner', jobKey: 'productDesigner', location: 'Bern', status: 'NEW', appliedAt: 'Jan 29, 2026', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
  { id: 3, name: 'Marc Dubois', roleKey: 'fullstackDeveloper', jobKey: 'fullstackDeveloper', location: 'Geneva', status: 'SHORTLISTED', appliedAt: 'Jan 25, 2026', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100' },
  { id: 4, name: 'Elena Rossi', roleKey: 'fullstackDeveloper', jobKey: 'fullstackDeveloper', location: 'Lugano', status: 'REJECTED', appliedAt: 'Jan 20, 2026', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' },
  { id: 5, name: 'Maya Keller', roleKey: 'marketingManager', jobKey: 'marketingManager', location: 'Basel', status: 'INTERVIEW', appliedAt: 'Jan 22, 2026', img: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&q=80&w=100' },
  { id: 6, name: 'Noah Schmid', roleKey: 'salesExecutive', jobKey: 'salesExecutive', location: 'Zürich', status: 'HIRED', appliedAt: 'Jan 10, 2026', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100' },
];

/* ─── Status visual config ───────────────────────────────────────────── */

const STATUS_CONFIG: Record<PipelineStatus, { dot: string; bg: string; text: string }> = {
  NEW:        { dot: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700' },
  IN_REVIEW:  { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700' },
  SHORTLISTED:{ dot: 'bg-indigo-500',  bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  INTERVIEW:  { dot: 'bg-purple-500',  bg: 'bg-purple-50',  text: 'text-purple-700' },
  HIRED:      { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  REJECTED:   { dot: 'bg-red-500',     bg: 'bg-red-50',     text: 'text-red-700' },
};

const KPI_CONFIG = [
  { key: 'totalCandidates' as const, icon: Users, color: 'text-[#162C66]', bg: 'bg-[#162C66]/[0.07]', getValue: (items: Applicant[]) => items.length },
  { key: 'newApplications' as const, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', getValue: (items: Applicant[]) => items.filter(i => i.status === 'NEW').length },
  { key: 'hired' as const, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', getValue: (items: Applicant[]) => items.filter(i => i.status === 'HIRED').length },
  { key: 'rejected' as const, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', getValue: (items: Applicant[]) => items.filter(i => i.status === 'REJECTED').length },
];

const ACTION_ICONS: Partial<Record<CandidateAction, typeof Eye>> = {
  VIEW_PROFILE: Eye,
  SHORTLIST: Star,
  REJECT: Ban,
  MESSAGE: MessageSquare,
  MOVE_TO_INTERVIEW: CalendarCheck,
  SCHEDULE_INTERVIEW: CalendarCheck,
  HIRE: UserCheck,
  RESTORE_TO_IN_REVIEW: RotateCcw,
};

/* ─── Page component ─────────────────────────────────────────────────── */

export default function ApplicationsPage() {
  const t = useTranslations('EmployerApplications');
  const titlesT = useTranslations('EmployerDashboard.jobTitles');

  const [items, setItems] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<PipelineStatus | 'ALL'>('ALL');
  const [jobFilter, setJobFilter] = useState<Applicant['jobKey'] | 'all'>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUp: boolean }>({ top: 0, left: 0, openUp: false });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirm, setConfirm] = useState<null | { kind: 'reject' | 'hire'; applicantId: number; toStatus: PipelineStatus }>(null);

  /* Close menu on outside click */
  useEffect(() => {
    if (openMenuId === null) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const stageLabel = useCallback((status: PipelineStatus) => t(`pipeline.stages.${statusToStageKey(status)}`), [t]);
  const titleLabel = useCallback((key: Applicant['roleKey']) => titlesT(key as any), [titlesT]);
  const jobLabel = useCallback((key: Applicant['jobKey']) => titlesT(key as any), [titlesT]);

  const jobKeys = useMemo(() => {
    const s = new Set<Applicant['jobKey']>();
    for (const a of items) s.add(a.jobKey);
    return Array.from(s);
  }, [items]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(PIPELINE_STATUSES.map(s => [s, 0])) as Record<PipelineStatus, number>;
    items.forEach(i => {
      const matchesJob = jobFilter === 'all' || i.jobKey === jobFilter;
      const matchesQuery = !query || i.name.toLowerCase().includes(query.toLowerCase());
      if (matchesJob && matchesQuery) c[i.status]++;
    });
    return c;
  }, [items, jobFilter, query]);

  const totalCount = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      if (activeTab !== 'ALL' && i.status !== activeTab) return false;
      if (jobFilter !== 'all' && i.jobKey !== jobFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return i.name.toLowerCase().includes(q) || i.location.toLowerCase().includes(q) || titleLabel(i.roleKey).toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }, [items, activeTab, jobFilter, query, titleLabel]);

  const pushToast = useCallback((variant: ToastVariant, title: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, variant, title, description }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const moveToStatus = useCallback((id: number, status: PipelineStatus) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  const handleAction = useCallback((action: CandidateAction, id: number) => {
    setOpenMenuId(null);
    const next = actionToNextStatus(action);
    if (!next) {
      if (action === 'VIEW_PROFILE') pushToast('info', t('toast.viewProfileTitle'), t('toast.viewProfileDesc'));
      if (action === 'MESSAGE') pushToast('info', t('toast.messageTitle'), t('toast.messageDesc'));
      if (action === 'SCHEDULE_INTERVIEW') pushToast('info', t('toast.scheduleTitle'), t('toast.scheduleDesc'));
      return;
    }
    const a = items.find(x => x.id === id);
    if (!a) return;
    if (a.status === 'HIRED') {
      pushToast('warning', t('toast.actionNotAllowedTitle'), t('toast.actionNotAllowedDesc'));
      return;
    }
    if (next === 'REJECTED' || next === 'HIRED') {
      setConfirm({ kind: next === 'REJECTED' ? 'reject' : 'hire', applicantId: id, toStatus: next });
      return;
    }
    moveToStatus(id, next);
    pushToast('success', t('toast.statusChangedTitle'), t('toast.statusChangedDesc', { status: stageLabel(next) }));
  }, [items, moveToStatus, pushToast, stageLabel, t]);

  const confirmData = useMemo(() => {
    if (!confirm) return null;
    const a = items.find(x => x.id === confirm.applicantId);
    if (!a) return null;
    return {
      title: confirm.kind === 'reject' ? t('confirm.rejectTitle') : t('confirm.hireTitle'),
      description: confirm.kind === 'reject' ? t('confirm.rejectDesc', { name: a.name }) : t('confirm.hireDesc', { name: a.name }),
      confirmLabel: confirm.kind === 'reject' ? t('confirm.rejectConfirm') : t('confirm.hireConfirm'),
      cancelLabel: t('confirm.cancel'),
      confirmVariant: confirm.kind === 'reject' ? 'outline' as const : 'primary' as const,
      confirmClassName: confirm.kind === 'reject' ? 'border-red-300 text-red-700 hover:bg-red-50' : undefined,
      onConfirm: () => {
        moveToStatus(a.id, confirm.toStatus);
        pushToast(confirm.kind === 'reject' ? 'danger' : 'success',
          confirm.kind === 'reject' ? t('toast.rejectedTitle') : t('toast.hiredTitle'),
          confirm.kind === 'reject' ? t('toast.rejectedDesc', { name: a.name }) : t('toast.hiredDesc', { name: a.name })
        );
        setConfirm(null);
      }
    };
  }, [confirm, items, moveToStatus, pushToast, t]);

  const tabs: { key: PipelineStatus | 'ALL'; label: string; count: number }[] = [
    { key: 'ALL', label: t('tabs.all'), count: totalCount },
    ...PIPELINE_STATUSES.map(s => ({ key: s, label: stageLabel(s), count: counts[s] })),
  ];

  return (
    <div className="space-y-6">
      <ToastStack items={toasts} onDismiss={dismissToast} dismissLabel={t('toast.dismiss')} />

      <ConfirmModal
        open={!!confirm}
        title={confirmData?.title ?? ''}
        description={confirmData?.description ?? ''}
        confirmLabel={confirmData?.confirmLabel ?? ''}
        cancelLabel={confirmData?.cancelLabel ?? ''}
        confirmVariant={confirmData?.confirmVariant}
        confirmClassName={confirmData?.confirmClassName}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirmData?.onConfirm()}
      />

      {/* ─── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-extrabold text-[#0B1F44] tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:text-[#0B1F44] transition-all"
        >
          <Download size={15} />
          Export
        </button>
      </div>

      {/* ─── KPI Row ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        {KPI_CONFIG.map((kpi) => {
          const Icon = kpi.icon;
          const value = kpi.getValue(items);
          return (
            <div key={kpi.key} className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', kpi.bg, kpi.color)}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                  {t(`metrics.${kpi.key}`)}
                </p>
                <p className="text-2xl font-extrabold text-[#0B1F44] tracking-tight leading-none tabular-nums">
                  {value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Toolbar + Tabs Card ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 sm:p-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all"
            />
          </div>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-[#0B1F44] focus:bg-white focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66]/30 outline-none transition-all cursor-pointer min-w-[180px]"
          >
            <option value="all">{t('filters.jobAll')}</option>
            {jobKeys.map(k => <option key={k} value={k}>{jobLabel(k)}</option>)}
          </select>
        </div>

        {/* Pipeline Tabs */}
        <div className="border-t border-slate-100 px-4 sm:px-5 overflow-x-auto scroll-hint">
          <div className="flex gap-1 min-w-max py-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              const statusKey = tab.key !== 'ALL' ? tab.key : null;
              const dotColor = statusKey ? STATUS_CONFIG[statusKey].dot : null;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={clsx(
                    'relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-lg transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-[#162C66] text-white shadow-sm'
                      : 'text-slate-500 hover:text-[#0B1F44] hover:bg-slate-50'
                  )}
                >
                  {dotColor && (
                    <span className={clsx('w-2 h-2 rounded-full shrink-0', isActive ? 'bg-white/60' : dotColor)} />
                  )}
                  {tab.label}
                  <span className={clsx(
                    'px-1.5 py-0.5 rounded-md text-[10px] font-bold min-w-[20px] text-center leading-tight',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Table ────────────────────────────────────────────────── */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-20 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Inbox size={28} className="text-slate-300" />
          </div>
          <p className="text-base font-semibold text-[#0B1F44] mb-1">{t('empty.hint')}</p>
          <p className="text-sm text-slate-400">Passen Sie Filter oder Suche an.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Table header info */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-slate-500">
              {filteredItems.length} {filteredItems.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
            </p>
          </div>

          {/* ── Mobile Card View ── */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredItems.map((applicant) => {
              const sc = STATUS_CONFIG[applicant.status];
              const isMenuOpen = openMenuId === applicant.id;
              return (
                <div key={applicant.id} className="px-4 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 ring-2 ring-white shadow-sm">
                        {applicant.img ? (
                          <img src={applicant.img} alt={applicant.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-100">
                            {applicant.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#0B1F44] truncate leading-tight">{applicant.name}</p>
                        <p className="text-[12px] text-slate-400 font-medium truncate mt-0.5">{titleLabel(applicant.roleKey)}</p>
                      </div>
                    </div>
                    <button
                      ref={(el) => { menuBtnRefs.current[applicant.id] = el; }}
                      onClick={() => {
                        if (isMenuOpen) { setOpenMenuId(null); return; }
                        const btn = menuBtnRefs.current[applicant.id];
                        if (btn) {
                          const rect = btn.getBoundingClientRect();
                          const spaceBelow = window.innerHeight - rect.bottom;
                          const openUp = spaceBelow < 260;
                          setMenuPos({ top: openUp ? rect.top : rect.bottom + 6, left: rect.right - 224, openUp });
                        }
                        setOpenMenuId(applicant.id);
                      }}
                      className={clsx(
                        'w-8 h-8 flex items-center justify-center rounded-lg transition-all shrink-0',
                        isMenuOpen ? 'bg-slate-100 text-[#162C66]' : 'text-slate-400 hover:text-[#162C66] hover:bg-slate-100'
                      )}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-500">
                    <span className="font-medium truncate">{jobLabel(applicant.jobKey)}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" />{applicant.location}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" />{applicant.appliedAt}</span>
                  </div>
                  <span className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold',
                    sc.bg, sc.text
                  )}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full', sc.dot)} />
                    {stageLabel(applicant.status)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden lg:block overflow-x-auto scroll-hint">
            <table className="w-full text-left min-w-[780px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[260px]">{t('table.candidate')}</th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('table.job')}</th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('table.location')}</th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('table.applied')}</th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('table.status')}</th>
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right w-[60px]">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((applicant, idx) => {
                  const actions = actionsForStatus(applicant.status);
                  const isMenuOpen = openMenuId === applicant.id;
                  const sc = STATUS_CONFIG[applicant.status];
                  const isLast = idx === filteredItems.length - 1;
                  return (
                    <tr
                      key={applicant.id}
                      className={clsx(
                        'group transition-colors duration-150 hover:bg-slate-50/70',
                        !isLast && 'border-b border-slate-100/60'
                      )}
                    >
                      {/* Candidate */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 ring-2 ring-white shadow-sm">
                            {applicant.img ? (
                              <img src={applicant.img} alt={applicant.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-100">
                                {applicant.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#0B1F44] truncate leading-tight">{applicant.name}</p>
                            <p className="text-[12px] text-slate-400 font-medium truncate mt-0.5">{titleLabel(applicant.roleKey)}</p>
                          </div>
                        </div>
                      </td>
                      {/* Job */}
                      <td className="px-4 py-4">
                        <p className="text-[13px] text-slate-600 font-medium truncate max-w-[200px]">{jobLabel(applicant.jobKey)}</p>
                      </td>
                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin size={13} className="shrink-0 text-slate-400" />
                          <p className="text-[13px] font-medium truncate">{applicant.location}</p>
                        </div>
                      </td>
                      {/* Applied */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={13} className="shrink-0 text-slate-400" />
                          <p className="text-[13px] font-medium tabular-nums">{applicant.appliedAt}</p>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold',
                          sc.bg, sc.text
                        )}>
                          <span className={clsx('w-1.5 h-1.5 rounded-full', sc.dot)} />
                          {stageLabel(applicant.status)}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <button
                          ref={(el) => { menuBtnRefs.current[applicant.id] = el; }}
                          onClick={() => {
                            if (isMenuOpen) { setOpenMenuId(null); return; }
                            const btn = menuBtnRefs.current[applicant.id];
                            if (btn) {
                              const rect = btn.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const openUp = spaceBelow < 260;
                              setMenuPos({
                                top: openUp ? rect.top : rect.bottom + 6,
                                left: rect.right - 224,
                                openUp,
                              });
                            }
                            setOpenMenuId(applicant.id);
                          }}
                          className={clsx(
                            'w-8 h-8 flex items-center justify-center rounded-lg transition-all',
                            isMenuOpen
                              ? 'bg-slate-100 text-[#162C66]'
                              : 'text-slate-400 hover:text-[#162C66] hover:bg-slate-100'
                          )}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Fixed-position actions menu (outside overflow) ────── */}
      {openMenuId !== null && (() => {
        const applicant = items.find(x => x.id === openMenuId);
        if (!applicant) return null;
        const actions = actionsForStatus(applicant.status);
        return (
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setOpenMenuId(null)} />
            <div
              ref={menuRef}
              className="fixed z-[100] w-56 bg-white rounded-xl shadow-[0_12px_40px_-8px_rgba(15,23,42,0.16)] border border-slate-200/60 py-1.5"
              style={{
                left: menuPos.left,
                ...(menuPos.openUp
                  ? { bottom: window.innerHeight - menuPos.top + 6 }
                  : { top: menuPos.top }),
              }}
            >
              {actions.map((action) => {
                const Icon = ACTION_ICONS[action] || Eye;
                const isDestructive = action === 'REJECT';
                return (
                  <button
                    key={action}
                    onClick={() => handleAction(action, openMenuId)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors text-left',
                      isDestructive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-slate-600 hover:text-[#0B1F44] hover:bg-slate-50'
                    )}
                  >
                    <Icon size={15} className="shrink-0 opacity-70" />
                    <span>{t(actionI18nKey(action) as any)}</span>
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  );
}
