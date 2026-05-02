'use client';

import { MapPin, Sparkles, Eye, Loader2, X, MessageSquare, Share2, Copy, Zap, Handshake } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useLocale } from 'next-intl';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { currencyFromCountryCode } from '@/lib/currency';
import { jobLocation } from '@/lib/location';
import { buildShareUrl, shareWhatsApp, shareFacebook, copyLink } from '@/lib/share';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';

const LOGO_COLORS = [
  'bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-500',
  'bg-red-600', 'bg-sky-500', 'bg-pink-600', 'bg-indigo-600',
];

function getLogoColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

type RecJob = {
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
  currency?: string | null;
  locationState: string;
  locationCity: string;
  when: string;
  description?: string | null;
  countryCode?: string | null;
  matchScore: number;
  isTopMatch: boolean;
  user?: { displayName?: string | null };
};

const loc = {
  de: {
    showMore: 'Mehr anzeigen', salary: 'Gehalt', where: 'Wo?', whenLabel: 'Starttermin',
    contact: 'Kontaktieren', share: 'Mit einem Freund teilen',
    linkCopied: 'Link kopiert!', contactSent: 'Kontaktanfrage gesendet!',
    urgent: 'Dringend', negotiation: 'Verhandlung',
    perHour: '/Stunde', perMonth: '/Monat', perYear: '/Jahr', provision: 'Provision',
    noJobs: 'Keine Empfehlungen verfügbar.',
  },
  en: {
    showMore: 'Show more', salary: 'Salary', where: 'Where?', whenLabel: 'Start date',
    contact: 'Contact', share: 'Share with a friend',
    linkCopied: 'Link copied!', contactSent: 'Contact request sent!',
    urgent: 'Urgent', negotiation: 'Negotiation',
    perHour: '/hour', perMonth: '/month', perYear: '/year', provision: 'Commission',
    noJobs: 'No recommendations available.',
  },
  fr: {
    showMore: 'Voir plus', salary: 'Salaire', where: 'Où ?', whenLabel: 'Début',
    contact: 'Contacter', share: 'Partager avec un ami',
    linkCopied: 'Lien copié !', contactSent: 'Demande envoyée !',
    urgent: 'Urgent', negotiation: 'Négociation',
    perHour: '/heure', perMonth: '/mois', perYear: '/an', provision: 'Commission',
    noJobs: 'Aucune recommandation disponible.',
  },
  it: {
    showMore: 'Mostra di più', salary: 'Stipendio', where: 'Dove?', whenLabel: 'Inizio',
    contact: 'Contattare', share: 'Condividi con un amico',
    linkCopied: 'Link copiato!', contactSent: 'Richiesta inviata!',
    urgent: 'Urgente', negotiation: 'Negoziazione',
    perHour: '/ora', perMonth: '/mese', perYear: '/anno', provision: 'Provvigione',
    noJobs: 'Nessuna raccomandazione disponibile.',
  },
  sq: {
    showMore: 'Shfaq më shumë', salary: 'Paga', where: 'Ku?', whenLabel: 'Fillimi',
    contact: 'Kontaktoni', share: 'Ndaj me një mik',
    linkCopied: 'Linku u kopjua!', contactSent: 'Kërkesa u dërgua!',
    urgent: 'Urgjente', negotiation: 'Negociatë',
    perHour: '/orë', perMonth: '/muaj', perYear: '/vit', provision: 'Provision',
    noJobs: 'Asnjë rekomandim i disponueshëm.',
  },
} as const;

export default function RecommendedJobs() {
  const locale = useLocale() as keyof typeof loc;
  const l = loc[locale] ?? loc.de;
  const { translateTitle } = useCategoryHelpers();

  const [jobs, setJobs] = useState<RecJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<RecJob | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; jobs: RecJob[] }>('/api/jobs/recommended', token)
      .then((res) => { if (res.ok && res.jobs) setJobs(res.jobs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const salaryPeriodLabel = (type: string) => {
    const t = (type || 'Hour').toLowerCase();
    if (t === 'hour') return l.perHour;
    if (t === 'month') return l.perMonth;
    if (t === 'year') return l.perYear;
    if (t === 'provision') return '';
    return '';
  };

  const whenBadge = (w: string) => {
    const wl = (w || '').toLowerCase();
    return wl === 'urgent' ? l.urgent : l.negotiation;
  };

  if (loading) {
    return <LoadingScreen variant="inline" hideText />;
  }

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-slate-400 font-medium text-center py-8">{l.noJobs}</p>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-[#162C66] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="space-y-3 sm:space-y-4">
        {jobs.map((job) => {
          const logo = translateTitle(job.category, locale as Locale).substring(0, 2).toUpperCase();
          const cur = job.currency || currencyFromCountryCode(job.countryCode);
          const salaryStr = job.salary
            ? (job.salaryType === 'Provision' ? `${job.salary}% ${l.provision}` : `${cur} ${job.salary.toLocaleString()}${salaryPeriodLabel(job.salaryType)}`)
            : null;

          return (
            <div
              key={job.id}
              className={clsx(
                "group relative bg-white rounded-2xl border p-4 sm:p-5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer",
                job.isTopMatch
                  ? "border-[#F5C400]/40 shadow-[0_2px_12px_rgba(245,196,0,0.08)]"
                  : "border-slate-200/60"
              )}
              onClick={() => { setSelectedJob(job); setShowShareMenu(false); }}
            >
              {job.isTopMatch && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 bg-[#F5C400]/10 text-[#B8920A] px-2 py-0.5 rounded-full">
                  <Sparkles size={11} />
                  <span className="text-[10px] sm:text-[11px] font-bold">Top Match</span>
                </div>
              )}
              <div className="flex gap-3.5 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#0B1F44] text-base sm:text-lg leading-snug mb-2.5 group-hover:text-[#162C66] transition-colors truncate pr-20 sm:pr-24">
                    {translateTitle(job.category, locale as Locale)}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold text-slate-500 bg-blue-50 px-2 py-1 rounded-lg">
                      <MapPin size={12} className="text-blue-500" />
                      {jobLocation(job.locationCity, job.countryCode, locale)}
                    </span>
                    <span className={clsx(
                      'inline-flex items-center gap-1 text-xs sm:text-[13px] font-semibold px-2 py-1 rounded-lg',
                      (job.when || '').toLowerCase() === 'urgent'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-700'
                    )}>
                      {(job.when || '').toLowerCase() === 'urgent'
                        ? <Zap size={12} className="text-red-500" />
                        : <Handshake size={12} className="text-amber-600" />}
                      {whenBadge(job.when)}
                    </span>
                    {salaryStr && (
                      <span className="inline-flex items-center text-xs sm:text-[13px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        {salaryStr}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-3 sm:mt-0 sm:absolute sm:bottom-4 sm:right-4">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setShowShareMenu(false); }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#162C66] hover:bg-blue-50 hover:text-blue-600 h-8 px-3 sm:px-3.5 rounded-lg border border-[#162C66]/10 hover:border-blue-200 transition-all"
                >
                  <Eye size={13} />
                  {l.showMore}
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
                  {sj.isTopMatch && (
                    <span className="flex items-center gap-1 bg-[#F5C400]/10 text-[#B8920A] px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0">
                      <Sparkles size={11} /> Top Match
                    </span>
                  )}
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
                    <span className={clsx(
                      'px-3 py-1.5 text-[13px] font-bold rounded-lg border',
                      whenW === 'urgent'
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    )}>
                      {whenBadge(sj.when)}
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
