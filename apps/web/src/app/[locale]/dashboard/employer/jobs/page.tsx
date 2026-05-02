'use client';

export const dynamic = 'force-dynamic';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/shared/StatusBadge';
import { Search, Eye, Edit3, Trash2, Briefcase, MapPin, Plus, MoreVertical, Pause, Play } from 'lucide-react';
import { SkeletonList } from '@/components/ui/LoadingScreen';
import { useTranslations, useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { currencyFromCountryCode } from '@/lib/currency';
import { jobLocation } from '@/lib/location';
import { Link, useRouter } from '@/i18n/routing';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';

interface BackendJob {
  id: string;
  category: string;
  companyName: string | null;
  salary: number | null;
  salaryType: string;
  locationState: string;
  locationCity: string;
  countryCode: string | null;
  status: string;
  views: number;
  when: string;
  createdAt: string;
}

type JobsTab = 'all' | 'active' | 'paused' | 'closed';

export default function MyJobsPage() {
  const t = useTranslations('EmployerJobs');
  const locale = useLocale();
  const { translateTitle } = useCategoryHelpers();
  const [activeTab, setActiveTab] = useState<JobsTab>('all');
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; jobs: BackendJob[] }>('/api/jobs/mine', token)
      .then((res) => { if (res.ok) setJobs(res.jobs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleView = (jobId: string) => {
    window.open(`/${locale}/jobs?id=${jobId}`, '_blank');
  };

  const handleDelete = useCallback(async (jobId: string) => {
    const msg = locale === 'de' ? 'Diesen Job wirklich löschen?' : locale === 'fr' ? 'Supprimer cette offre ?' : locale === 'it' ? 'Eliminare questa offerta?' : locale === 'sq' ? 'Fshij këtë punë?' : 'Delete this job?';
    if (!window.confirm(msg)) return;
    const token = getToken();
    if (!token) return;
    setDeletingId(jobId);
    try {
      const res = await api.delete<{ ok: boolean }>(`/api/jobs/${jobId}`, token);
      if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {}
    setDeletingId(null);
  }, [locale]);

  const handleToggleStatus = useCallback(async (job: BackendJob) => {
    const token = getToken();
    if (!token) return;
    const newStatus = job.status === 'Active' ? 'Paused' : 'Active';
    setTogglingId(job.id);
    try {
      const res = await api.put<{ ok: boolean; job: BackendJob }>(`/api/jobs/${job.id}`, { status: newStatus }, token);
      if (res.ok) setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: newStatus } : j));
    } catch {}
    setTogglingId(null);
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const hours = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000));
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' });
      return hours < 24 ? rtf.format(-hours, 'hour') : rtf.format(-Math.floor(hours / 24), 'day');
    } catch { return `${hours}h`; }
  };

  const counts = useMemo(() => {
    const active = jobs.filter((j) => j.status === 'Active').length;
    const paused = jobs.filter((j) => j.status === 'Paused').length;
    const closed = jobs.filter((j) => j.status === 'Closed').length;
    return { all: jobs.length, active, paused, closed };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (activeTab === 'all') return jobs;
    const status = activeTab === 'active' ? 'Active' : activeTab === 'paused' ? 'Paused' : 'Closed';
    return jobs.filter((j) => j.status === status);
  }, [activeTab, jobs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#162C66]/[0.06] text-[#162C66] flex items-center justify-center shrink-0 mt-0.5">
            <Briefcase size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F44] tracking-tight">{t('title')}</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400] outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scroll-hint pb-1">
        {([
          { key: 'all' as const, label: t('tabs.all', { count: counts.all }) },
          { key: 'active' as const, label: t('tabs.active', { count: counts.active }) },
          { key: 'paused' as const, label: t('tabs.paused', { count: counts.paused }) },
          { key: 'closed' as const, label: t('tabs.closed', { count: counts.closed }) }
        ]).map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={isActive}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-[#0B1F44] text-white shadow-sm'
                  : 'bg-white text-slate-500 hover:text-[#0B1F44] hover:bg-slate-50 border border-slate-200/60'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && <SkeletonList count={3} avatar={false} />}

      {/* Empty State */}
      {!loading && filteredJobs.length === 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-5">
              <Briefcase size={26} />
            </div>
            <h3 className="text-base font-bold text-[#0B1F44] mb-2">{t('emptyTitle')}</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">{t('emptyDesc')}</p>
            <Link
              href="/dashboard/employer/jobs/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5C400] text-[#162C66] font-bold text-sm rounded-xl hover:bg-[#ffe533] transition-all shadow-sm"
            >
              <Plus size={16} />
              {t('emptyAction')}
            </Link>
          </div>
        </Card>
      )}

      {/* Mobile Card View */}
      <div className={clsx('lg:hidden space-y-3', filteredJobs.length === 0 && 'hidden')}>
        {filteredJobs.map((job) => (
          <Card key={job.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#0B1F44] text-sm truncate">{translateTitle(job.category, locale as Locale)}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <span className="text-[12px] text-slate-400 font-medium flex items-center gap-1"><MapPin size={10} />{jobLocation(job.locationCity, job.countryCode, locale)}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-[12px] text-slate-400 font-medium">{formatTimeAgo(job.createdAt)}</span>
                </div>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {job.salary && <span className="text-[13px] font-bold text-[#0B1F44] tabular-nums">{currencyFromCountryCode(job.countryCode)} {job.salary}/{job.salaryType.toLowerCase()}</span>}
                <span className="text-[12px] text-slate-400 font-medium flex items-center gap-1"><Eye size={10} />{job.views}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={() => handleView(job.id)} className="p-1.5 text-slate-400 hover:text-[#0B1F44] hover:bg-slate-100 rounded-lg transition-all" title={t('actions.viewDetails')}>
                  <Eye size={16} />
                </button>
                <Link href={`/dashboard/employer/jobs/${job.id}/edit`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title={t('actions.edit')}>
                  <Edit3 size={16} />
                </Link>
                <div className="relative" ref={openMenuId === job.id ? menuRef : undefined}>
                  <button onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)} className="p-1.5 text-slate-400 hover:text-[#0B1F44] hover:bg-slate-100 rounded-lg transition-all">
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === job.id && (
                    <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                      <button
                        onClick={() => { handleToggleStatus(job); setOpenMenuId(null); }}
                        disabled={togglingId === job.id}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        {job.status === 'Active' ? <Pause size={14} className="text-amber-500" /> : <Play size={14} className="text-emerald-500" />}
                        {job.status === 'Active' ? t('actions.pause') : t('actions.activate')}
                      </button>
                      <button
                        onClick={() => { handleDelete(job.id); setOpenMenuId(null); }}
                        disabled={deletingId === job.id}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {t('actions.delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className={clsx('p-0 hidden lg:block', filteredJobs.length === 0 && '!hidden')}>
        <div className="overflow-x-auto scroll-hint">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('table.jobDetails')}</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('table.location')}</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">{t('table.views')}</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-32">{t('table.status')}</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right w-36">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#0B1F44] text-sm mb-0.5">{translateTitle(job.category, locale as Locale)}</p>
                    <div className="flex items-center gap-2">
                      {job.salary && <span className="text-[12px] text-slate-500 font-medium">{currencyFromCountryCode(job.countryCode)} {job.salary}/{job.salaryType.toLowerCase()}</span>}
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[12px] text-slate-400 font-medium">{formatTimeAgo(job.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600 font-medium">{jobLocation(job.locationCity, job.countryCode, locale)}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm font-bold text-[#0B1F44] tabular-nums">{job.views}</span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleView(job.id)} className="p-1.5 text-slate-400 hover:text-[#0B1F44] hover:bg-slate-100 rounded-lg transition-all" title={t('actions.viewDetails')}>
                        <Eye size={16} />
                      </button>
                      <Link href={`/dashboard/employer/jobs/${job.id}/edit`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title={t('actions.edit')}>
                        <Edit3 size={16} />
                      </Link>
                      <div className="relative" ref={openMenuId === `desk-${job.id}` ? menuRef : undefined}>
                        <button onClick={() => setOpenMenuId(openMenuId === `desk-${job.id}` ? null : `desk-${job.id}`)} className="p-1.5 text-slate-400 hover:text-[#0B1F44] hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === `desk-${job.id}` && (
                          <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                            <button
                              onClick={() => { handleToggleStatus(job); setOpenMenuId(null); }}
                              disabled={togglingId === job.id}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                              {job.status === 'Active' ? <Pause size={14} className="text-amber-500" /> : <Play size={14} className="text-emerald-500" />}
                              {job.status === 'Active' ? t('actions.pause') : t('actions.activate')}
                            </button>
                            <button
                              onClick={() => { handleDelete(job.id); setOpenMenuId(null); }}
                              disabled={deletingId === job.id}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              {t('actions.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
