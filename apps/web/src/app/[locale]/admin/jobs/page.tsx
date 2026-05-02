'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Search, Trash2, MapPin, Briefcase, Crown, Loader2, DollarSign, Clock, FileEdit, User, ChevronDown, ChevronLeft, ChevronRight, Hash, LayoutList, Eye, Mail, Phone, Sparkles, Image, Pencil, X, Check, Building2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import CurrencySelect from '@/components/CurrencySelect';
import JobCategoryAutocomplete from '@/components/JobCategoryAutocomplete';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { type LocationSuggestion } from '@/hooks/useLocationAutocomplete';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';

const LIMIT = 20;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ListingUser {
  id: string;
  email: string;
  displayName: string | null;
  isPremium: boolean;
}

interface JobRow {
  id: string;
  category: string;
  companyName: string | null;
  contactName: string;
  contactSurname: string;
  contactEmail: string | null;
  contactPhone: string;
  salary: number | null;
  salaryType: string | null;
  currency: string | null;
  locationState: string;
  locationCity: string;
  when: string | null;
  status: string;
  description: string | null;
  images: string;
  createdAt: string;
  user: ListingUser;
}

interface AdRow {
  id: string;
  category: string;
  firstName: string;
  surname: string;
  phone: string;
  livingPlace: string;
  experience: string;
  skills: string;
  spokenLanguages: string;
  photoUrl: string | null;
  status: string;
  createdAt: string;
  user: ListingUser;
}

type UnifiedRow = { type: 'job'; data: JobRow } | { type: 'ad'; data: AdRow };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Heute';
  if (days === 1) return 'Gestern';
  if (days < 30) return `vor ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `vor ${months}M`;
  return `vor ${Math.floor(months / 12)}J`;
}

const INPUT_CLS = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-medium text-[#0B1F44] focus:bg-white focus:border-[#162C66]/20 focus:ring-2 focus:ring-[#162C66]/5 outline-none transition-all';
const LABEL_CLS = 'flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5';

export default function AdminJobsPage() {
  const t = useTranslations('Admin');
  const [typeFilter, setTypeFilter] = useState<'all' | 'jobs' | 'ads'>('all');
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalAds, setTotalAds] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Edit job modal
  const [editJob, setEditJob] = useState<JobRow | null>(null);
  const locale = useLocale();
  const { translateTitle } = useCategoryHelpers();
  const [jobForm, setJobForm] = useState({ category: '', contactName: '', contactSurname: '', contactPhone: '', contactEmail: '', companyName: '', salary: '', salaryType: '', currency: '', locationState: '', locationCity: '', when: '', status: '' });
  const [editJobSaving, setEditJobSaving] = useState(false);

  // Edit ad modal
  const [editAd, setEditAd] = useState<AdRow | null>(null);
  const [adForm, setAdForm] = useState({ category: '', firstName: '', surname: '', phone: '', livingPlace: '', experience: '', status: '' });
  const [editAdSaving, setEditAdSaving] = useState(false);
  const [adPhotoFile, setAdPhotoFile] = useState<File | null>(null);
  const [adPhotoPreview, setAdPhotoPreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      qp.set('page', String(page));
      qp.set('limit', String(LIMIT));
      if (search.trim()) qp.set('search', search.trim());

      if (typeFilter === 'all' || typeFilter === 'jobs') {
        const res = await api.get<{ ok: boolean; jobs: JobRow[]; total: number }>(`/api/admin/all-jobs?${qp}`, token);
        if (res.ok) { setJobs(res.jobs); setTotalJobs(res.total); }
      } else { setJobs([]); setTotalJobs(0); }

      if (typeFilter === 'all' || typeFilter === 'ads') {
        const res = await api.get<{ ok: boolean; ads: AdRow[]; total: number }>(`/api/admin/all-ads?${qp}`, token);
        if (res.ok) { setAds(res.ads); setTotalAds(res.total); }
      } else { setAds([]); setTotalAds(0); }
    } catch {}
    setLoading(false);
  }, [page, search, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const unified: UnifiedRow[] = [
    ...jobs.map(j => ({ type: 'job' as const, data: j })),
    ...ads.map(a => ({ type: 'ad' as const, data: a })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());

  const totalCount = totalJobs + totalAds;
  const totalPages = Math.ceil(totalCount / LIMIT);

  const handleDeleteJob = async (id: string, name: string) => {
    if (!confirm(t('adsPage.confirmDeleteJob', { name }))) return;
    const token = getToken();
    if (!token) return;
    setDeleting(id);
    try {
      const res = await api.delete<{ ok: boolean }>(`/api/admin/all-jobs/${id}`, token);
      if (res.ok) { setJobs(prev => prev.filter(j => j.id !== id)); setTotalJobs(prev => prev - 1); }
    } catch {}
    setDeleting(null);
  };

  const handleDeleteAd = async (id: string, name: string) => {
    if (!confirm(t('adsPage.confirmDeleteAd', { name }))) return;
    const token = getToken();
    if (!token) return;
    setDeleting(id);
    try {
      const res = await api.delete<{ ok: boolean }>(`/api/admin/all-ads/${id}`, token);
      if (res.ok) { setAds(prev => prev.filter(a => a.id !== id)); setTotalAds(prev => prev - 1); }
    } catch {}
    setDeleting(null);
  };

  const openEditJob = (job: JobRow) => {
    setEditJob(job);
    setJobForm({
      category: job.category, contactName: job.contactName, contactSurname: job.contactSurname,
      contactPhone: job.contactPhone, contactEmail: job.contactEmail || '', companyName: job.companyName || '',
      salary: job.salary != null ? String(job.salary) : '', salaryType: job.salaryType || 'Hour',
      currency: job.currency || 'EUR', locationState: job.locationState, locationCity: job.locationCity,
      when: job.when || '', status: job.status,
    });
  };

  const handleSaveJob = async () => {
    if (!editJob) return;
    const token = getToken();
    if (!token) return;
    setEditJobSaving(true);
    try {
      const payload = {
        ...jobForm,
        salary: jobForm.salary ? Number(jobForm.salary) : null,
      };
      const res = await api.patch<{ ok: boolean; job: JobRow }>(`/api/admin/all-jobs/${editJob.id}`, payload, token);
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === editJob.id ? { ...j, ...payload, salary: payload.salary, contactEmail: payload.contactEmail || null, companyName: payload.companyName || null, when: payload.when || null } : j));
        setEditJob(null);
      }
    } catch {}
    setEditJobSaving(false);
  };

  const openEditAd = (ad: AdRow) => {
    setEditAd(ad);
    setAdPhotoFile(null);
    setAdPhotoPreview(null);
    setAdForm({
      category: ad.category, firstName: ad.firstName, surname: ad.surname,
      phone: ad.phone, livingPlace: ad.livingPlace, experience: ad.experience || '',
      status: ad.status,
    });
  };

  const handleSaveAd = async () => {
    if (!editAd) return;
    const token = getToken();
    if (!token) return;
    setEditAdSaving(true);
    try {
      const res = await api.patch<{ ok: boolean; ad: AdRow }>(`/api/admin/all-ads/${editAd.id}`, adForm, token);
      if (res.ok) {
        let updatedPhoto = editAd.photoUrl;
        // Upload new photo if selected
        if (adPhotoFile) {
          const formData = new FormData();
          formData.append('photo', adPhotoFile);
          const photoRes = await api.upload<{ ok: boolean; photoUrl: string }>(`/api/ads/${editAd.id}/photo`, formData, token);
          if (photoRes.ok) updatedPhoto = photoRes.photoUrl;
        }
        setAds(prev => prev.map(a => a.id === editAd.id ? { ...a, ...adForm, photoUrl: updatedPhoto } : a));
        setEditAd(null);
      }
    } catch {}
    setEditAdSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#162C66] flex items-center justify-center">
            <LayoutList size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-[#0B1F44] tracking-tight">{t('adsPage.title')}</h1>
            <p className="text-[13px] text-slate-400 font-medium">{t('adsPage.subtitle', { count: totalCount })}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <LayoutList size={15} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[22px] font-black text-[#0B1F44] leading-none tabular-nums">{totalCount}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Gesamt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Briefcase size={15} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[22px] font-black text-[#0B1F44] leading-none tabular-nums">{totalJobs}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{t('adsPage.filterJobs')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <FileEdit size={15} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[22px] font-black text-[#0B1F44] leading-none tabular-nums">{totalAds}</p>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{t('adsPage.filterAds')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('adsPage.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-medium text-[#0B1F44] placeholder:text-slate-300 focus:bg-white focus:border-[#162C66]/20 focus:ring-2 focus:ring-[#162C66]/5 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            {([
              { key: 'all', icon: LayoutList, label: t('adsPage.filterAll') },
              { key: 'jobs', icon: Briefcase, label: t('adsPage.filterJobs') },
              { key: 'ads', icon: FileEdit, label: t('adsPage.filterAds') },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => { setTypeFilter(key); setPage(1); }}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap',
                  typeFilter === key
                    ? 'bg-[#162C66] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-[#162C66] mb-3" />
            <p className="text-[13px] text-slate-400 font-medium">Lade Inserate...</p>
          </div>
        ) : unified.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutList size={24} className="text-slate-300" />
            </div>
            <p className="font-bold text-[#0B1F44] text-[15px] mb-1">{t('adsPage.noAds')}</p>
            <p className="text-[13px] text-slate-400">Versuchen Sie andere Filteroptionen</p>
          </div>
        ) : (
          <div>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="text-left px-5 py-3 w-10">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">Typ</span>
                    </th>
                    <th className="text-left px-4 py-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">Inserat</span>
                    </th>
                    <th className="text-left px-4 py-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('adsPage.colCreator')}</span>
                    </th>
                    <th className="text-left px-4 py-3 w-36">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('adsPage.colLocation')}</span>
                    </th>
                    <th className="text-left px-4 py-3 w-28">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">{t('adsPage.colDate')}</span>
                    </th>
                    <th className="text-right px-5 py-3 w-24">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]"></span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unified.map((item, idx) => {
                    const isJob = item.type === 'job';
                    const id = item.data.id;
                    const uniqueKey = `${item.type}-${id}`;
                    const isOpen = expanded === uniqueKey;

                    if (isJob) {
                      const job = item.data as JobRow;
                      let images: string[] = [];
                      try { images = JSON.parse(job.images || '[]'); } catch {}

                      return (
                        <tr key={uniqueKey} className={clsx(
                          'group transition-colors',
                          idx < unified.length - 1 && !isOpen && 'border-b border-slate-100/60',
                          isOpen && 'border-b border-slate-200',
                          job.user.isPremium && 'bg-amber-50/20'
                        )}>
                          <td colSpan={6} className="p-0">
                            <div
                              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                              onClick={() => setExpanded(isOpen ? null : uniqueKey)}
                            >
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap bg-blue-50 text-blue-600 border-blue-100">
                                <Briefcase size={10} />
                                {t('adsPage.typeJob')}
                              </span>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-bold text-[#0B1F44] truncate group-hover:text-[#162C66] transition-colors">{translateTitle(job.category, locale as Locale)}</p>
                                  {job.user.isPremium && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[10px] font-black rounded-md uppercase tracking-wide border border-amber-200/60">PRO</span>
                                  )}
                                  {job.salary != null && job.salary > 0 && (
                                    <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-100">
                                      <DollarSign size={10} />{job.salary} / {job.salaryType}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {job.companyName && <span className="text-[11px] text-slate-400 flex items-center gap-1"><Briefcase size={10} />{job.companyName}</span>}
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1"><User size={10} />{job.user.displayName || job.user.email}</span>
                                </div>
                              </div>

                              <span className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 w-36 shrink-0 truncate">
                                <MapPin size={11} className="shrink-0" />{job.locationCity}
                              </span>

                              <div className="hidden lg:flex flex-col w-28 shrink-0">
                                <span className="text-[11px] font-semibold text-slate-500">{formatDate(job.createdAt)}</span>
                                <span className="text-[10px] text-slate-400">{timeAgo(job.createdAt)}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <ChevronDown size={14} className={clsx('text-slate-300 transition-transform', isOpen && 'rotate-180')} />
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditJob(job); }}
                                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all border border-transparent hover:border-blue-100 opacity-60 group-hover:opacity-100"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteJob(id, job.category); }}
                                  disabled={deleting === id}
                                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all border border-transparent hover:border-red-100 disabled:opacity-50 opacity-60 group-hover:opacity-100"
                                >
                                  {deleting === id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </div>
                            </div>

                            {isOpen && (
                              <div className="px-5 pb-5 pt-2 bg-slate-50/40 border-t border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div className="bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2"><User size={10} />{t('adsPage.colCreator')}</p>
                                    <p className="text-[13px] font-bold text-[#0B1F44]">{job.contactName} {job.contactSurname}</p>
                                    <p className="text-[12px] text-slate-500 flex items-center gap-1 mt-1"><Phone size={10} />{job.contactPhone}</p>
                                    {job.contactEmail && <p className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={10} />{job.contactEmail}</p>}
                                  </div>
                                  <div className="bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2"><MapPin size={10} />{t('adsPage.colLocation')}</p>
                                    <p className="text-[13px] font-bold text-[#0B1F44]">{job.locationCity}</p>
                                    <p className="text-[12px] text-slate-500 mt-0.5">{job.locationState}</p>
                                  </div>
                                  <div className="bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2"><Eye size={10} />{t('adsPage.colStatus')}</p>
                                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold', job.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : job.status === 'Paused' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')}>{job.status}</span>
                                  </div>
                                  <div className="bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2"><Clock size={10} />{t('adsPage.colDate')}</p>
                                    <p className="text-[13px] font-bold text-[#0B1F44]">{job.when || '—'}</p>
                                  </div>
                                </div>
                                {job.description && (
                                  <div className="mt-3 bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Beschreibung</p>
                                    <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">{job.description}</p>
                                  </div>
                                )}
                                {images.length > 0 && (
                                  <div className="mt-3 flex gap-2 flex-wrap">
                                    {images.map((img, i) => (
                                      <img key={i} src={img.startsWith('/uploads/') ? `${API_URL}${img}` : img} alt={`Job ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    } else {
                      const ad = item.data as AdRow;
                      const uniqueKeyAd = `ad-${id}`;
                      const isOpenAd = expanded === uniqueKeyAd;

                      return (
                        <tr key={uniqueKeyAd} className={clsx(
                          'group transition-colors',
                          idx < unified.length - 1 && !isOpenAd && 'border-b border-slate-100/60',
                          isOpenAd && 'border-b border-slate-200',
                          ad.user.isPremium && 'bg-amber-50/20'
                        )}>
                          <td colSpan={6} className="p-0">
                            <div
                              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                              onClick={() => setExpanded(isOpenAd ? null : uniqueKeyAd)}
                            >
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap bg-emerald-50 text-emerald-600 border-emerald-100">
                                <FileEdit size={10} />
                                {t('adsPage.typeAd')}
                              </span>

                              {ad.photoUrl ? (
                                <img src={ad.photoUrl.startsWith('/uploads/') ? `${API_URL}${ad.photoUrl}` : ad.photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0"><User size={14} className="text-slate-300" /></div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-bold text-[#0B1F44] truncate group-hover:text-[#162C66] transition-colors">{translateTitle(ad.category, locale as Locale)}</p>
                                  {ad.user.isPremium && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[10px] font-black rounded-md uppercase tracking-wide border border-amber-200/60">PRO</span>
                                  )}
                                  {ad.experience && (
                                    <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 text-[11px] font-bold border border-violet-100">
                                      <Clock size={10} />{ad.experience}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1"><User size={10} />{ad.firstName} {ad.surname}</span>
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1"><Mail size={10} />{ad.user.email}</span>
                                </div>
                              </div>

                              <span className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 w-36 shrink-0 truncate">
                                <MapPin size={11} className="shrink-0" />{ad.livingPlace}
                              </span>

                              <div className="hidden lg:flex flex-col w-28 shrink-0">
                                <span className="text-[11px] font-semibold text-slate-500">{formatDate(ad.createdAt)}</span>
                                <span className="text-[10px] text-slate-400">{timeAgo(ad.createdAt)}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <ChevronDown size={14} className={clsx('text-slate-300 transition-transform', isOpenAd && 'rotate-180')} />
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditAd(ad); }}
                                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all border border-transparent hover:border-blue-100 opacity-60 group-hover:opacity-100"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteAd(id, `${ad.firstName} ${ad.surname}`); }}
                                  disabled={deleting === id}
                                  className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all border border-transparent hover:border-red-100 disabled:opacity-50 opacity-60 group-hover:opacity-100"
                                >
                                  {deleting === id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </div>
                            </div>

                            {isOpenAd && (
                              <div className="px-5 pb-5 pt-2 bg-slate-50/40 border-t border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div className="bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2"><User size={10} />{t('adsPage.colCreator')}</p>
                                    <p className="text-[13px] font-bold text-[#0B1F44]">{ad.firstName} {ad.surname}</p>
                                    <p className="text-[12px] text-slate-500 flex items-center gap-1 mt-1"><Phone size={10} />{ad.phone}</p>
                                    <p className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={10} />{ad.user.email}</p>
                                  </div>
                                  <div className="bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2"><MapPin size={10} />{t('adsPage.colLocation')}</p>
                                    <p className="text-[13px] font-bold text-[#0B1F44]">{ad.livingPlace}</p>
                                  </div>
                                  <div className="bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2"><Eye size={10} />{t('adsPage.colStatus')}</p>
                                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold', ad.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : ad.status === 'Paused' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')}>{ad.status}</span>
                                  </div>
                                </div>
                                {ad.skills && (
                                  <div className="mt-3 bg-white rounded-lg border border-slate-200/60 p-3">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2"><Sparkles size={10} />Skills</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {ad.skills.split(',').map((s, i) => (
                                        <span key={i} className="inline-flex items-center px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md text-[11px] font-bold border border-violet-100">{s.trim()}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {ad.photoUrl && (
                                  <div className="mt-3">
                                    <img src={ad.photoUrl.startsWith('/uploads/') ? `${API_URL}${ad.photoUrl}` : ad.photoUrl} alt="Profile" className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm" />
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="lg:hidden divide-y divide-slate-100">
              {unified.map((item) => {
                const isJob = item.type === 'job';
                const id = item.data.id;
                const uniqueKey = `${item.type}-${id}`;
                const isOpen = expanded === uniqueKey;

                if (isJob) {
                  const job = item.data as JobRow;
                  return (
                    <div key={uniqueKey} className={clsx('p-4', job.user.isPremium && 'bg-amber-50/20')}>
                      <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : uniqueKey)}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-blue-50 border-blue-100 text-blue-500">
                          <Briefcase size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[14px] font-bold text-[#0B1F44] truncate">{translateTitle(job.category, locale as Locale)}</p>
                            {job.user.isPremium && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[10px] font-black rounded-md uppercase border border-amber-200/60">PRO</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 mb-2">
                            {job.companyName && <span className="flex items-center gap-1"><Briefcase size={10} />{job.companyName}</span>}
                            <span className="flex items-center gap-1"><MapPin size={10} />{job.locationCity}</span>
                            <span>{formatDate(job.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ChevronDown size={12} className={clsx('text-slate-300 transition-transform', isOpen && 'rotate-180')} />
                            <div className="ml-auto flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); openEditJob(job); }} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all"><Pencil size={12} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteJob(id, job.category); }} disabled={deleting === id} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all disabled:opacity-50">
                                {deleting === id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[12px]">
                          <p><span className="font-bold text-slate-500">Kontakt:</span> {job.contactName} {job.contactSurname} · {job.contactPhone}</p>
                          <p><span className="font-bold text-slate-500">Status:</span> {job.status}</p>
                          {job.description && <p className="text-slate-500 line-clamp-3">{job.description}</p>}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const ad = item.data as AdRow;
                  return (
                    <div key={uniqueKey} className={clsx('p-4', ad.user.isPremium && 'bg-amber-50/20')}>
                      <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : uniqueKey)}>
                        {ad.photoUrl ? (
                          <img src={ad.photoUrl.startsWith('/uploads/') ? `${API_URL}${ad.photoUrl}` : ad.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-emerald-50 border-emerald-100 text-emerald-500">
                            <FileEdit size={16} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[14px] font-bold text-[#0B1F44] truncate">{translateTitle(ad.category, locale as Locale)}</p>
                            {ad.user.isPremium && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[10px] font-black rounded-md uppercase border border-amber-200/60">PRO</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 mb-2">
                            <span className="flex items-center gap-1"><User size={10} />{ad.firstName} {ad.surname}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} />{ad.livingPlace}</span>
                            <span>{formatDate(ad.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ChevronDown size={12} className={clsx('text-slate-300 transition-transform', isOpen && 'rotate-180')} />
                            <div className="ml-auto flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); openEditAd(ad); }} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all"><Pencil size={12} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteAd(id, `${ad.firstName} ${ad.surname}`); }} disabled={deleting === id} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all disabled:opacity-50">
                                {deleting === id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[12px]">
                          <p><span className="font-bold text-slate-500">Kontakt:</span> {ad.phone} · {ad.user.email}</p>
                          <p><span className="font-bold text-slate-500">Status:</span> {ad.status}</p>
                          {ad.skills && (
                            <div className="flex flex-wrap gap-1">
                              {ad.skills.split(',').map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md text-[11px] font-bold">{s.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/30">
            <p className="text-[11px] text-slate-400 font-semibold tabular-nums">
              {t('adsPage.pageInfo', { page, totalPages, total: totalCount })}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-400 hover:text-[#162C66] hover:border-[#162C66]/20 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={clsx(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all',
                      p === page
                        ? 'bg-[#162C66] text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-100'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-400 hover:text-[#162C66] hover:border-[#162C66]/20 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Job Modal ── */}
      {editJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditJob(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#162C66] to-[#1a3577] px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center"><Briefcase size={16} className="text-white" /></div>
                  <div>
                    <h3 className="text-[16px] font-black text-white">Stellenangebot bearbeiten</h3>
                    <p className="text-[12px] text-white/50">{editJob.category}</p>
                  </div>
                </div>
                <button onClick={() => setEditJob(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"><X size={16} /></button>
              </div>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Category */}
              <div>
                <label className={LABEL_CLS}><Briefcase size={11} />Kategorie</label>
                <JobCategoryAutocomplete
                  value={jobForm.category}
                  onChange={(key) => setJobForm(p => ({ ...p, category: key }))}
                  locale={locale}
                  placeholder="Kategorie wählen..."
                  className={INPUT_CLS}
                />
              </div>

              {/* Status */}
              <div>
                <label className={LABEL_CLS}><Eye size={11} />Status</label>
                <div className="flex gap-2">
                  {(['Active', 'Paused', 'Closed'] as const).map(s => (
                    <button key={s} onClick={() => setJobForm(p => ({ ...p, status: s }))} className={clsx(
                      'flex-1 px-3 py-2.5 rounded-lg text-[12px] font-bold transition-all border',
                      jobForm.status === s
                        ? s === 'Active' ? 'bg-emerald-500 text-white border-emerald-500' : s === 'Paused' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-500 text-white border-slate-500'
                        : 'bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100'
                    )}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><User size={11} />Kontakt</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Vorname</label>
                    <input type="text" value={jobForm.contactName} onChange={e => setJobForm(p => ({ ...p, contactName: e.target.value }))} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Nachname</label>
                    <input type="text" value={jobForm.contactSurname} onChange={e => setJobForm(p => ({ ...p, contactSurname: e.target.value }))} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}><Phone size={11} />Telefon</label>
                    <input type="text" value={jobForm.contactPhone} onChange={e => setJobForm(p => ({ ...p, contactPhone: e.target.value }))} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}><Mail size={11} />E-Mail</label>
                    <input type="email" value={jobForm.contactEmail} onChange={e => setJobForm(p => ({ ...p, contactEmail: e.target.value }))} className={INPUT_CLS} />
                  </div>
                </div>
              </div>

              {/* Company */}
              <div>
                <label className={LABEL_CLS}><Building2 size={11} />Firma</label>
                <input type="text" value={jobForm.companyName} onChange={e => setJobForm(p => ({ ...p, companyName: e.target.value }))} className={INPUT_CLS} />
              </div>

              {/* Salary */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5"><DollarSign size={11} />Gehalt</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Betrag</label>
                    <input type="number" value={jobForm.salary} onChange={e => setJobForm(p => ({ ...p, salary: e.target.value }))} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Typ</label>
                    <select value={jobForm.salaryType} onChange={e => setJobForm(p => ({ ...p, salaryType: e.target.value }))} className={INPUT_CLS}>
                      <option value="Hour">Stunde</option>
                      <option value="Month">Monat</option>
                      <option value="Year">Jahr</option>
                      <option value="Provision">Provision</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Währung</label>
                    <CurrencySelect value={jobForm.currency} onChange={(v) => setJobForm(p => ({ ...p, currency: v }))} locale={locale} compact />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className={LABEL_CLS}><MapPin size={11} />Standort</label>
                <LocationAutocomplete
                  value={jobForm.locationCity ? `${jobForm.locationCity}, ${jobForm.locationState}` : ''}
                  onChange={(v) => setJobForm(p => ({ ...p, locationCity: v, locationState: '' }))}
                  onSelect={(s: LocationSuggestion) => setJobForm(p => ({ ...p, locationCity: s.city, locationState: s.state }))}
                  placeholder="Stadt suchen..."
                  showIcon={false}
                  inputClassName={INPUT_CLS}
                />
              </div>

              {/* When */}
              <div>
                <label className={LABEL_CLS}><Clock size={11} />Starttermin</label>
                <input type="text" value={jobForm.when} onChange={e => setJobForm(p => ({ ...p, when: e.target.value }))} className={INPUT_CLS} />
              </div>

            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
              <button onClick={() => setEditJob(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-all">Abbrechen</button>
              <button onClick={handleSaveJob} disabled={editJobSaving} className="flex-1 px-4 py-2.5 bg-[#162C66] text-white rounded-lg text-[13px] font-bold hover:bg-[#1a3577] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm">
                {editJobSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Ad Modal ── */}
      {editAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditAd(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center"><FileEdit size={16} className="text-white" /></div>
                  <div>
                    <h3 className="text-[16px] font-black text-white">Profil bearbeiten</h3>
                    <p className="text-[12px] text-white/50">{editAd.firstName} {editAd.surname}</p>
                  </div>
                </div>
                <button onClick={() => setEditAd(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"><X size={16} /></button>
              </div>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Category */}
              <div>
                <label className={LABEL_CLS}><Briefcase size={11} />Kategorie</label>
                <JobCategoryAutocomplete
                  value={adForm.category}
                  onChange={(key) => setAdForm(p => ({ ...p, category: key }))}
                  locale={locale}
                  placeholder="Kategorie wählen..."
                  className={INPUT_CLS}
                />
              </div>

              {/* Status */}
              <div>
                <label className={LABEL_CLS}><Eye size={11} />Status</label>
                <div className="flex gap-2">
                  {(['Active', 'Paused'] as const).map(s => (
                    <button key={s} onClick={() => setAdForm(p => ({ ...p, status: s }))} className={clsx(
                      'flex-1 px-3 py-2.5 rounded-lg text-[12px] font-bold transition-all border',
                      adForm.status === s
                        ? s === 'Active' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100'
                    )}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}><User size={11} />Vorname</label>
                  <input type="text" value={adForm.firstName} onChange={e => setAdForm(p => ({ ...p, firstName: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Nachname</label>
                  <input type="text" value={adForm.surname} onChange={e => setAdForm(p => ({ ...p, surname: e.target.value }))} className={INPUT_CLS} />
                </div>
              </div>

              {/* Phone + Experience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLS}><Phone size={11} />Telefon</label>
                  <input type="text" value={adForm.phone} onChange={e => setAdForm(p => ({ ...p, phone: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}><Clock size={11} />Erfahrung</label>
                  <input type="text" value={adForm.experience} onChange={e => setAdForm(p => ({ ...p, experience: e.target.value }))} className={INPUT_CLS} />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className={LABEL_CLS}><MapPin size={11} />Wohnort</label>
                <LocationAutocomplete
                  value={adForm.livingPlace}
                  onChange={(v) => setAdForm(p => ({ ...p, livingPlace: v }))}
                  onSelect={(s: LocationSuggestion) => setAdForm(p => ({ ...p, livingPlace: `${s.city}, ${s.state}, ${s.country}` }))}
                  placeholder="Wohnort suchen..."
                  showIcon={false}
                  inputClassName={INPUT_CLS}
                />
              </div>

              {/* Photo */}
              {editAd && (
                <div>
                  <label className={LABEL_CLS}><Image size={11} />Profilbild</label>
                  <div className="flex items-center gap-4">
                    {(editAd.photoUrl || adPhotoPreview) ? (
                      <img
                        src={adPhotoPreview || (editAd.photoUrl?.startsWith('/uploads/') ? `${API_URL}${editAd.photoUrl}` : editAd.photoUrl || '')}
                        alt="Profil"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <User size={24} className="text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer transition-all w-fit">
                        <Image size={14} />
                        Bild ändern
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAdPhotoFile(file);
                              setAdPhotoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG, max. 5 MB</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
              <button onClick={() => setEditAd(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-all">Abbrechen</button>
              <button onClick={handleSaveAd} disabled={editAdSaving} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-[13px] font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm">
                {editAdSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
