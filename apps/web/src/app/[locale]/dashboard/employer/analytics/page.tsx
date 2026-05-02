'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import MetricCard from '@/components/shared/MetricCard';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/shared/StatusBadge';
import { BarChart3, Eye, Share2, Heart, MessageCircle, Briefcase, CheckCircle, PauseCircle, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';

export const dynamic = 'force-dynamic';

interface JobStat {
  id: string;
  category: string;
  companyName: string | null;
  status: string;
  views: number;
  shares: number;
  favorites: number;
  conversations: number;
  locationCity: string;
  locationState: string;
  createdAt: string;
}

interface AnalyticsData {
  totals: {
    totalJobs: number;
    activeJobs: number;
    pausedJobs: number;
    totalViews: number;
    totalShares: number;
    totalFavorites: number;
    totalConversations: number;
  };
  jobs: JobStat[];
}

const loc = {
  de: {
    title: 'Analysen', subtitle: 'Überblick über die Leistung Ihrer Stellenangebote',
    totalJobs: 'Stellenangebote', activeJobs: 'Aktive Jobs', totalViews: 'Aufrufe',
    totalShares: 'Geteilt', totalFavorites: 'Favorisiert', totalConversations: 'Nachrichten',
    pausedJobs: 'Pausiert',
    tableTitle: 'Job-Performance', tableSubtitle: 'Detaillierte Statistik pro Stellenangebot',
    colJob: 'Stellenangebot', colLocation: 'Standort', colViews: 'Aufrufe', colShares: 'Geteilt',
    colFavorites: 'Favoriten', colMessages: 'Nachrichten', colStatus: 'Status',
    noJobs: 'Keine Stellenangebote', noJobsHint: 'Erstellen Sie Ihr erstes Stellenangebot, um Analysen zu sehen',
    postJob: 'Job veröffentlichen', loading: 'Daten werden geladen...',
  },
  en: {
    title: 'Analytics', subtitle: 'Overview of your job listings performance',
    totalJobs: 'Job Listings', activeJobs: 'Active Jobs', totalViews: 'Views',
    totalShares: 'Shared', totalFavorites: 'Favorited', totalConversations: 'Messages',
    pausedJobs: 'Paused',
    tableTitle: 'Job Performance', tableSubtitle: 'Detailed statistics per job listing',
    colJob: 'Job Listing', colLocation: 'Location', colViews: 'Views', colShares: 'Shared',
    colFavorites: 'Favorites', colMessages: 'Messages', colStatus: 'Status',
    noJobs: 'No job listings', noJobsHint: 'Create your first job listing to see analytics',
    postJob: 'Post a Job', loading: 'Loading data...',
  },
  fr: {
    title: 'Analytique', subtitle: 'Aperçu des performances de vos offres d\'emploi',
    totalJobs: 'Offres d\'emploi', activeJobs: 'Emplois actifs', totalViews: 'Vues',
    totalShares: 'Partagés', totalFavorites: 'Favoris', totalConversations: 'Messages',
    pausedJobs: 'En pause',
    tableTitle: 'Performance des emplois', tableSubtitle: 'Statistiques détaillées par offre',
    colJob: 'Offre d\'emploi', colLocation: 'Lieu', colViews: 'Vues', colShares: 'Partagés',
    colFavorites: 'Favoris', colMessages: 'Messages', colStatus: 'Statut',
    noJobs: 'Aucune offre', noJobsHint: 'Créez votre première offre d\'emploi pour voir les analytiques',
    postJob: 'Publier un emploi', loading: 'Chargement...',
  },
  it: {
    title: 'Analisi', subtitle: 'Panoramica delle prestazioni delle tue offerte di lavoro',
    totalJobs: 'Offerte di lavoro', activeJobs: 'Lavori attivi', totalViews: 'Visualizzazioni',
    totalShares: 'Condivisi', totalFavorites: 'Preferiti', totalConversations: 'Messaggi',
    pausedJobs: 'In pausa',
    tableTitle: 'Performance lavori', tableSubtitle: 'Statistiche dettagliate per offerta',
    colJob: 'Offerta di lavoro', colLocation: 'Luogo', colViews: 'Visualizzazioni', colShares: 'Condivisi',
    colFavorites: 'Preferiti', colMessages: 'Messaggi', colStatus: 'Stato',
    noJobs: 'Nessuna offerta', noJobsHint: 'Crea la tua prima offerta di lavoro per vedere le analisi',
    postJob: 'Pubblica un lavoro', loading: 'Caricamento...',
  },
  sq: {
    title: 'Analitika', subtitle: 'Përmbledhje e performancës së ofertave tuaja të punës',
    totalJobs: 'Oferta pune', activeJobs: 'Punë aktive', totalViews: 'Shikime',
    totalShares: 'Ndarë', totalFavorites: 'Preferenca', totalConversations: 'Mesazhe',
    pausedJobs: 'Në pauzë',
    tableTitle: 'Performanca e punëve', tableSubtitle: 'Statistikat e detajuara për ofertë',
    colJob: 'Oferta e punës', colLocation: 'Vendndodhja', colViews: 'Shikime', colShares: 'Ndarë',
    colFavorites: 'Preferenca', colMessages: 'Mesazhe', colStatus: 'Statusi',
    noJobs: 'Asnjë ofertë pune', noJobsHint: 'Krijoni ofertën tuaj të parë të punës për të parë analitikën',
    postJob: 'Publiko punë', loading: 'Duke ngarkuar...',
  },
} as const;

export default function EmployerAnalyticsPage() {
  const locale = useLocale() as keyof typeof loc;
  const t = loc[locale] ?? loc.de;
  const { translateTitle } = useCategoryHelpers();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; totals: AnalyticsData['totals']; jobs: JobStat[] }>('/api/jobs/analytics', token)
      .then((res) => {
        if (res.ok) setData({ totals: res.totals, jobs: res.jobs });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxViews = data ? Math.max(1, ...data.jobs.map((j) => j.views)) : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#162C66]/[0.06] text-[#162C66] flex items-center justify-center shrink-0 mt-0.5">
          <BarChart3 size={24} />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F44] tracking-tight mb-1">{t.title}</h2>
          <p className="text-sm text-slate-500 font-medium">{t.subtitle}</p>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
                <div className="h-8 bg-slate-200 rounded w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      ) : !data || data.totals.totalJobs === 0 ? (
        /* Empty state */
        <Card className="p-12 text-center">
          <Briefcase size={40} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#0B1F44] mb-2">{t.noJobs}</h3>
          <p className="text-sm text-slate-500 mb-6">{t.noJobsHint}</p>
          <a
            href={`/${locale}/dashboard/employer/jobs/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5C400] text-[#0B1A3B] text-[13px] font-bold rounded-xl hover:bg-[#FFD633] transition-all"
          >
            {t.postJob}
          </a>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <MetricCard label={t.totalJobs} value={data.totals.totalJobs} icon={<Briefcase size={22} />} iconColor="navy" />
            <MetricCard label={t.activeJobs} value={data.totals.activeJobs} icon={<CheckCircle size={22} />} iconColor="emerald" />
            <MetricCard label={t.totalViews} value={data.totals.totalViews.toLocaleString()} icon={<Eye size={22} />} iconColor="blue" />
            <MetricCard label={t.totalShares} value={data.totals.totalShares} icon={<Share2 size={22} />} iconColor="violet" />
            <MetricCard label={t.totalFavorites} value={data.totals.totalFavorites} icon={<Heart size={22} />} iconColor="rose" />
            <MetricCard label={t.totalConversations} value={data.totals.totalConversations} icon={<MessageCircle size={22} />} iconColor="amber" />
          </div>

          {/* Visual bars – Views per job */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-[#0B1F44] mb-4">{t.colViews} / {t.colJob}</h3>
            <div className="space-y-3">
              {data.jobs.slice(0, 8).map((job) => (
                <div key={job.id} className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold text-slate-600 w-32 sm:w-48 truncate" title={translateTitle(job.category, locale as Locale)}>
                    {translateTitle(job.category, locale as Locale)}
                  </span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#162C66] to-[#2A4A9E] rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(3, (job.views / maxViews) * 100)}%` }}
                    >
                      {job.views > 0 && (
                        <span className="text-[10px] font-bold text-white tabular-nums">{job.views}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Job performance table */}
          <div>
            <div className="px-1 mb-4">
              <h3 className="text-base font-bold text-[#0B1F44]">{t.tableTitle}</h3>
              <p className="text-sm text-slate-400 font-medium mt-0.5">{t.tableSubtitle}</p>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {data.jobs.map((job) => (
                <Card key={job.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0B1F44] text-sm truncate">{translateTitle(job.category, locale as Locale)}</p>
                      <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />{job.locationCity}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.colViews}</p>
                      <p className="text-sm font-bold text-[#0B1F44] tabular-nums">{job.views}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.colShares}</p>
                      <p className="text-sm font-bold text-[#0B1F44] tabular-nums">{job.shares}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.colFavorites}</p>
                      <p className="text-sm font-bold text-[#0B1F44] tabular-nums">{job.favorites}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.colMessages}</p>
                      <p className="text-sm font-bold text-[#0B1F44] tabular-nums">{job.conversations}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table */}
            <Card className="p-0 overflow-hidden hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.colJob}</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t.colLocation}</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center w-20">{t.colViews}</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center w-20">{t.colShares}</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center w-20">{t.colFavorites}</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center w-24">{t.colMessages}</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">{t.colStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.jobs.map((job) => (
                      <tr key={job.id} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#0B1F44] text-sm">{translateTitle(job.category, locale as Locale)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-400" />{job.locationCity}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-[#0B1F44] tabular-nums text-sm">{job.views}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-[#0B1F44] tabular-nums text-sm">{job.shares}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-[#0B1F44] tabular-nums text-sm">{job.favorites}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-[#0B1F44] tabular-nums text-sm">{job.conversations}</span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={job.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
