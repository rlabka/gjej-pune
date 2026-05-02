'use client';

import { useLocale } from 'next-intl';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/shared/EmptyState';
import { MapPin, Trash2, BookmarkX, Search, Bookmark, Loader2, Briefcase, Eye, X, MessageSquare, Share2, Copy } from 'lucide-react';
import { jobLocation } from '@/lib/location';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/routing';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import FeatureDisabled from '@/app/[locale]/dashboard/job-seeker/_components/FeatureDisabled';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { currencyFromCountryCode } from '@/lib/currency';
import { buildShareUrl, shareWhatsApp, shareFacebook, copyLink } from '@/lib/share';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';

export const dynamic = 'force-dynamic';

type BackendJob = {
  id: string;
  userId: string;
  category: string;
  companyName?: string | null;
  contactName: string;
  contactSurname: string;
  contactPhone: string;
  contactEmail?: string | null;
  salary?: number | null;
  salaryType: string;
  locationState: string;
  locationCity: string;
  when: string;
  description?: string | null;
  status: string;
  createdAt: string;
  countryCode?: string | null;
  user?: { displayName?: string | null };
};

const LOGO_COLORS = [
  'bg-blue-600', 'bg-sky-500', 'bg-red-600', 'bg-emerald-600',
  'bg-amber-500', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600',
];

function getLogoColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

const loc = {
  de: {
    title: 'Gespeicherte Jobs', subtitle: 'Jobs, die du dir gemerkt hast.',
    findJobs: 'Jobs finden', showMore: 'Mehr anzeigen',
    salary: 'Gehalt', where: 'Wo?', whenLabel: 'Starttermin',
    contact: 'Kontaktieren', share: 'Mit einem Freund teilen',
    linkCopied: 'Link kopiert!', contactSent: 'Kontaktanfrage gesendet!',
    urgent: 'Dringend', negotiation: 'Verhandlung',
    perHour: '/Stunde', perMonth: '/Monat', perYear: '/Jahr',
    noSaved: 'Noch keine gespeicherten Jobs', noSavedDesc: 'Durchsuche Jobs und speichere die, die dich interessieren.',
  },
  en: {
    title: 'Saved Jobs', subtitle: 'Jobs you\'ve bookmarked for later review.',
    findJobs: 'Find Jobs', showMore: 'Show more',
    salary: 'Salary', where: 'Where?', whenLabel: 'Start date',
    contact: 'Contact', share: 'Share with a friend',
    linkCopied: 'Link copied!', contactSent: 'Contact request sent!',
    urgent: 'Urgent', negotiation: 'Negotiation',
    perHour: '/hour', perMonth: '/month', perYear: '/year',
    noSaved: 'No saved jobs yet', noSavedDesc: 'Start browsing jobs and save the ones that interest you most.',
  },
  fr: {
    title: 'Emplois sauvegardés', subtitle: 'Les emplois que vous avez mis en favoris.',
    findJobs: 'Trouver des emplois', showMore: 'Voir plus',
    salary: 'Salaire', where: 'Où ?', whenLabel: 'Début',
    contact: 'Contacter', share: 'Partager avec un ami',
    linkCopied: 'Lien copié !', contactSent: 'Demande envoyée !',
    urgent: 'Urgent', negotiation: 'Négociation',
    perHour: '/heure', perMonth: '/mois', perYear: '/an',
    noSaved: 'Aucun emploi sauvegardé', noSavedDesc: 'Parcourez les emplois et sauvegardez ceux qui vous intéressent.',
  },
  it: {
    title: 'Lavori salvati', subtitle: 'Lavori che hai salvato per dopo.',
    findJobs: 'Trova lavori', showMore: 'Mostra di più',
    salary: 'Stipendio', where: 'Dove?', whenLabel: 'Inizio',
    contact: 'Contattare', share: 'Condividi con un amico',
    linkCopied: 'Link copiato!', contactSent: 'Richiesta inviata!',
    urgent: 'Urgente', negotiation: 'Negoziazione',
    perHour: '/ora', perMonth: '/mese', perYear: '/anno',
    noSaved: 'Nessun lavoro salvato', noSavedDesc: 'Sfoglia i lavori e salva quelli che ti interessano di più.',
  },
  sq: {
    title: 'Punët e ruajtura', subtitle: 'Punët që keni shënuar për më vonë.',
    findJobs: 'Gjej punë', showMore: 'Shfaq më shumë',
    salary: 'Paga', where: 'Ku?', whenLabel: 'Fillimi',
    contact: 'Kontaktoni', share: 'Ndaj me një mik',
    linkCopied: 'Linku u kopjua!', contactSent: 'Kërkesa u dërgua!',
    urgent: 'Urgjente', negotiation: 'Negociatë',
    perHour: '/orë', perMonth: '/muaj', perYear: '/vit',
    noSaved: 'Asnjë punë e ruajtur', noSavedDesc: 'Shfletoni punët dhe ruani ato që ju interesojnë më shumë.',
  },
} as const;

export default function SavedJobsPage() {
  const locale = useLocale() as keyof typeof loc;
  const l = loc[locale] ?? loc.de;
  const { translateTitle } = useCategoryHelpers();

  const [savedJobs, setSavedJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<BackendJob | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (!getJobSeekerConfig().features.showSavedJobs) {
    return <FeatureDisabled />;
  }

  const fetchSavedJobs = useCallback(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; jobs: BackendJob[] }>('/api/favorites/saved-jobs', token)
      .then((res) => {
        if (res.ok) setSavedJobs(res.jobs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSavedJobs(); }, [fetchSavedJobs]);

  const removeJob = async (id: string) => {
    if (removingId === id) return;
    const token = getToken();
    if (!token) return;
    setRemovingId(id);
    try {
      const res = await api.post<{ ok: boolean }>('/api/favorites/toggle', { targetType: 'job', targetId: id }, token);
      if (res.ok) {
        setSavedJobs((prev) => prev.filter((job) => job.id !== id));
        setToast('Job entfernt');
      }
    } catch {}
    setRemovingId(null);
  };

  const openDetail = (job: BackendJob) => {
    setSelectedJob(job);
    setShowShareMenu(false);
  };

  const salaryPeriodLabel = (type: string) => {
    const t = (type || 'Hour').toLowerCase();
    if (t === 'hour') return l.perHour;
    if (t === 'month') return l.perMonth;
    if (t === 'year') return l.perYear;
    return '';
  };

  const whenLabelFn = (w: string) => {
    const wl = (w || '').toLowerCase();
    if (wl === 'urgent') return l.urgent;
    return l.negotiation;
  };

  if (loading) {
    return <LoadingScreen variant="section" />;
  }

  return (
    <>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-50 rounded-xl flex items-center justify-center">
            <Bookmark size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-[#0B1F44] tracking-tight">{l.title}</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">{l.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-slate-400">
            {savedJobs.length} {savedJobs.length === 1 ? 'Job' : 'Jobs'}
          </span>
          <Link href="/jobs">
            <Button variant="primary" size="sm" className="rounded-xl shadow-sm">
              <Search size={15} />
              <span>{l.findJobs}</span>
            </Button>
          </Link>
        </div>
      </div>

      {savedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {savedJobs.map((job) => {
            const logo = translateTitle(job.category, locale as Locale).substring(0, 2).toUpperCase();
            const cur = currencyFromCountryCode(job.countryCode);
            const salaryStr = job.salary ? `${cur} ${job.salary.toLocaleString()}${salaryPeriodLabel(job.salaryType)}` : null;

            return (
              <div
                key={job.id}
                className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Card top accent */}
                <div className="h-1 bg-gradient-to-r from-[#162C66] via-[#1a3578] to-[#F5C400]" />

                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm ${getLogoColor(job.id)}`}>
                        {logo}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#0B1F44] text-[15px] sm:text-base leading-snug truncate group-hover:text-[#162C66] transition-colors">
                          {translateTitle(job.category, locale as Locale)}
                        </h4>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeJob(job.id)}
                      disabled={removingId === job.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 disabled:opacity-50"
                    >
                      {removingId === job.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <MapPin size={11} className="text-slate-400" />
                      {jobLocation(job.locationCity, job.countryCode, locale)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Briefcase size={11} className="text-slate-400" />
                      {whenLabelFn(job.when)}
                    </span>
                    {salaryStr && (
                      <span className="inline-flex items-center text-[11px] sm:text-xs font-bold text-[#162C66] bg-[#162C66]/[0.04] px-2 py-1 rounded-lg">
                        {salaryStr}
                      </span>
                    )}
                  </div>

                  {/* Show more button */}
                  <div className="mt-auto pt-3 border-t border-slate-100/80">
                    <button
                      type="button"
                      onClick={() => openDetail(job)}
                      className="w-full flex items-center justify-center gap-2 h-10 bg-[#162C66]/[0.06] text-[#162C66] text-xs sm:text-sm font-bold rounded-xl hover:bg-[#162C66] hover:text-white border border-[#162C66]/20 transition-all"
                    >
                      <Eye size={15} />
                      {l.showMore}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <EmptyState
            title={l.noSaved}
            description={l.noSavedDesc}
            icon={<BookmarkX size={48} />}
            action={
              <Link href="/jobs">
                <Button variant="primary" className="rounded-xl">
                  <Search size={18} />
                  <span>{l.findJobs}</span>
                </Button>
              </Link>
            }
          />
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (() => {
        const sj = selectedJob;
        const cur = currencyFromCountryCode(sj.countryCode);
        const whenW = (sj.when || '').toLowerCase();
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedJob(null); setShowShareMenu(false); }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  type="button"
                  onClick={() => { setSelectedJob(null); setShowShareMenu(false); }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3 mb-5 pr-10">
                  <h2 className="text-xl font-extrabold text-[#0B1F44]">{translateTitle(sj.category, locale as Locale)}</h2>
                </div>

                {/* Info rows */}
                <div className="space-y-3 mb-5">
                  {sj.salary && (
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-bold text-slate-500 w-16 shrink-0">{l.salary}:</span>
                      <span className="px-3 py-1.5 bg-emerald-50 rounded-lg text-emerald-700 text-base font-extrabold">
                        {cur} {sj.salary.toLocaleString('de-CH')}{salaryPeriodLabel(sj.salaryType)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-bold text-slate-500 w-16 shrink-0">{l.where}:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-[13px] font-semibold rounded-lg border border-slate-200">
                      <MapPin size={13} className="text-slate-400" />
                      {jobLocation(sj.locationCity, sj.countryCode, locale)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-bold text-slate-500 w-16 shrink-0">{l.whenLabel}:</span>
                    <span className={`px-3 py-1.5 text-[13px] font-bold rounded-lg border ${
                      whenW === 'urgent'
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {whenLabelFn(sj.when)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {sj.description && (
                  <div className="mb-2">
                    <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">{sj.description}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 p-6 pt-4 space-y-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 h-12 bg-[#162C66] text-white rounded-xl font-bold text-[14px] hover:bg-[#0F1E45] transition-all"
                  onClick={async () => {
                    const token = getToken();
                    if (!token) return;
                    try {
                      const res = await api.post<{ ok: boolean; conversation: { id: string } }>('/api/messages/conversations', { targetUserId: selectedJob.userId, jobId: selectedJob.id, jobTitle: selectedJob.category }, token);
                      setSelectedJob(null); setShowShareMenu(false);
                      window.location.href = `/${locale}/dashboard/job-seeker/messages?conv=${res.conversation.id}`;
                    } catch { setToast(l.contactSent); setTimeout(() => setToast(null), 3000); }
                  }}
                >
                  <MessageSquare size={18} />
                  {l.contact}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <Share2 size={16} />
                    {l.share}
                  </button>
                  {showShareMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-10">
                      <button
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                        onClick={() => { const url = buildShareUrl('job', sj.id); shareWhatsApp(url); setShowShareMenu(false); setToast('WhatsApp!'); setTimeout(() => setToast(null), 3000); }}
                      >
                        <FaWhatsapp color="#25D366" size={16} /> WhatsApp
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                        onClick={() => { const url = buildShareUrl('job', sj.id); shareFacebook(url); setShowShareMenu(false); setToast('Facebook!'); setTimeout(() => setToast(null), 3000); }}
                      >
                        <FaFacebook color="#1877F2" size={16} /> Facebook
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                        onClick={() => { const url = buildShareUrl('job', sj.id); copyLink(url); setShowShareMenu(false); setToast(l.linkCopied); setTimeout(() => setToast(null), 3000); }}
                      >
                        <Copy size={16} className="text-slate-500" /> Copy link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

