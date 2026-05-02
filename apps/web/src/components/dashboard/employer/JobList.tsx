'use client';

import StatusBadge from '@/components/shared/StatusBadge';
import { Eye, Edit3, MoreVertical, Briefcase, Pause, Play, Trash2, MapPin, TrendingUp } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Link } from '@/i18n/routing';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';

const SALARY_TYPE_LABELS: Record<string, Record<string, string>> = {
  hour:  { de: 'Stunde', en: 'hour', fr: 'heure', it: 'ora', sq: 'orë' },
  month: { de: 'Monat', en: 'month', fr: 'mois', it: 'mese', sq: 'muaj' },
  year:  { de: 'Jahr', en: 'year', fr: 'an', it: 'anno', sq: 'vit' },
  provision: { de: 'Provision', en: 'commission', fr: 'commission', it: 'provvigione', sq: 'provision' },
};

function localSalaryType(type: string, locale: string): string {
  return SALARY_TYPE_LABELS[type.toLowerCase()]?.[locale] ?? type.toLowerCase();
}

interface BackendJob {
  id: string;
  category: string;
  salary: number | null;
  salaryType: string;
  currency: string;
  locationCity: string;
  status: string;
  views: number;
}

export default function JobList() {
  const t = useTranslations('EmployerDashboard.jobsTable');
  const locale = useLocale();
  const { translateTitle } = useCategoryHelpers();
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.get<{ ok: boolean; jobs: BackendJob[] }>('/api/jobs/mine', token)
      .then((res) => { if (res.ok) setJobs(res.jobs.slice(0, 4)); })
      .catch(() => {});
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

  const tDash = useTranslations('EmployerDashboard');

  const ContextMenu = ({ job, menuId }: { job: BackendJob; menuId: string }) => (
    <div className="relative" ref={openMenuId === menuId ? menuRef : undefined}>
      <button
        onClick={() => setOpenMenuId(openMenuId === menuId ? null : menuId)}
        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
        aria-label={t('more')}
      >
        <MoreVertical size={15} />
      </button>
      {openMenuId === menuId && (
        <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.1)] py-1.5 z-50">
          <button
            onClick={() => { handleToggleStatus(job); setOpenMenuId(null); }}
            disabled={togglingId === job.id}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {job.status === 'Active' ? <Pause size={14} className="text-amber-500" /> : <Play size={14} className="text-emerald-500" />}
            {job.status === 'Active'
              ? (locale === 'de' ? 'Pausieren' : locale === 'fr' ? 'Mettre en pause' : locale === 'it' ? 'Metti in pausa' : locale === 'sq' ? 'Ndalo' : 'Pause')
              : (locale === 'de' ? 'Aktivieren' : locale === 'fr' ? 'Activer' : locale === 'it' ? 'Attiva' : locale === 'sq' ? 'Aktivizo' : 'Activate')
            }
          </button>
          <button
            onClick={() => { handleDelete(job.id); setOpenMenuId(null); }}
            disabled={deletingId === job.id}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            {locale === 'de' ? 'Löschen' : locale === 'fr' ? 'Supprimer' : locale === 'it' ? 'Elimina' : locale === 'sq' ? 'Fshij' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
            <Briefcase size={24} />
          </div>
          <h4 className="text-sm font-semibold text-[#0B1F44] mb-1">{tDash('noJobsYet')}</h4>
          <p className="text-[13px] text-slate-400 max-w-xs">{tDash('noJobsYetDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile card layout ── */}
      <div className="xl:hidden space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0B1F44] text-[15px] leading-snug">{translateTitle(job.category, locale as Locale)}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[12px] text-slate-400">
                  {job.salary && <span className="font-medium">{job.salaryType === 'Provision' ? `${job.salary}% ${localSalaryType(job.salaryType, locale)}` : `${job.currency || 'EUR'} ${job.salary.toLocaleString()}/${localSalaryType(job.salaryType, locale)}`}</span>}
                  {job.salary && job.locationCity && <span className="text-slate-200">·</span>}
                  {job.locationCity && <span className="flex items-center gap-0.5"><MapPin size={10} />{job.locationCity}</span>}
                </div>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-400 flex items-center gap-1 font-medium"><Eye size={11} />{job.views}</span>
              <div className="flex items-center gap-0.5">
                <button onClick={() => handleView(job.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"><Eye size={15} /></button>
                <Link href={`/dashboard/employer/jobs/${job.id}/edit`} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={15} /></Link>
                <ContextMenu job={job} menuId={job.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop table layout ── */}
      <div className="hidden xl:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40">
              <th className="px-6 py-3 text-left">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('jobTitle')}</span>
              </th>
              <th className="px-4 py-3 text-center w-20">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('views')}</span>
              </th>
              <th className="px-4 py-3 text-left w-28">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('status')}</span>
              </th>
              <th className="px-5 py-3 text-right w-28">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, idx) => (
              <React.Fragment key={job.id}>
                <tr className={clsx(
                  'group transition-colors hover:bg-slate-50/60',
                  idx < jobs.length - 1 && 'border-b border-slate-100/60'
                )}>
                  {/* Job info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-[#162C66]/[0.04] group-hover:border-[#162C66]/10 group-hover:text-[#162C66] transition-all">
                        <Briefcase size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[#0B1F44] leading-snug group-hover:text-[#162C66] transition-colors">{translateTitle(job.category, locale as Locale)}</p>
                        <p className="text-[12px] text-slate-400 mt-0.5 truncate">
                          {job.salary ? (job.salaryType === 'Provision' ? `${job.salary}%` : `${job.currency || 'CHF'} ${job.salary.toLocaleString()}/${localSalaryType(job.salaryType, locale)}`) : ''}
                          {job.salary && job.locationCity ? ' · ' : ''}
                          {job.locationCity || ''}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Views */}
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100/80">
                      <TrendingUp size={11} className="text-slate-400" />
                      <span className="text-[13px] font-semibold text-[#0B1F44] tabular-nums">{job.views}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusBadge status={job.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => handleView(job.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" aria-label={t('view')}>
                        <Eye size={15} />
                      </button>
                      <Link href={`/dashboard/employer/jobs/${job.id}/edit`} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" aria-label={t('edit')}>
                        <Edit3 size={15} />
                      </Link>
                      <ContextMenu job={job} menuId={`desk-${job.id}`} />
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
