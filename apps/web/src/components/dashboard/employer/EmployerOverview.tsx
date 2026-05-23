'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { clsx } from 'clsx';
import JobList from './JobList';
import MatchingCandidates from './MatchingCandidates';
import Card from '@/components/ui/Card';
import { Plus, ArrowRight, ArrowUpRight, Briefcase, MessageSquare, Search, Heart, Crown, Globe, Reply, Eye, Clock, Bell, Star, Zap } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { getEmployerConfig, CONFIG_UPDATED_EVENT } from '@/lib/siteConfig';
import { getSession as getAuthSession, getDisplayName as getAuthDisplayName, getToken, getIsPremium } from '@/lib/auth';
import { api } from '@/lib/api';
import { getNotifTitle, getNotifBody } from '@/lib/notificationLocale';

const ui = {
  de: {
    helloPrefix: 'Willkommen zurück, ', helloSuffix: '!',
    subtitle: 'Hier ist, was mit Ihrer Rekrutierung passiert.',
    newMessages: (n: number) => n === 0 ? 'Keine neuen Nachrichten' : `${n} neue Nachrichten`,
    postNewJob: 'Neuen Job veröffentlichen',
    findCandidate: 'Neue Kandidaten finden',
    myJobOffers: 'Meine Stellenangebote',
    favoriteCandidates: 'Favorisierte Kandidaten',
    contactCandidates: 'Kandidaten weltweit unbegrenzt kontaktieren',
    beFirst: 'Sei das erste Stellenangebot in der Suchliste',
    respondMessages: 'Auf jede neue Nachricht unbegrenzt antworten',
    seeVisitors: 'Sehen, wer dein Profil besucht hat',
    upgradePremium: 'Auf Premium upgraden',
    goPremium: 'Jetzt Premium werden',
  },
  en: {
    helloPrefix: 'Welcome back, ', helloSuffix: '!',
    subtitle: 'Here is what\'s happening with your recruitment.',
    newMessages: (n: number) => n === 0 ? 'No new messages' : `${n} new messages`,
    postNewJob: 'Post new job',
    findCandidate: 'Find new candidate',
    myJobOffers: 'My job offers',
    favoriteCandidates: 'Favorite candidates',
    contactCandidates: 'Contact without limit candidates worldwide',
    beFirst: 'Be the first job offer in the searching list',
    respondMessages: 'Respond without limit to every new message',
    seeVisitors: 'See who visited your profile',
    upgradePremium: 'Upgrade to Premium',
    goPremium: 'Go Premium Now',
  },
  fr: {
    helloPrefix: 'Bienvenue, ', helloSuffix: ' !',
    subtitle: 'Voici ce qui se passe avec votre recrutement.',
    newMessages: (n: number) => n === 0 ? 'Aucun nouveau message' : `${n} nouveaux messages`,
    postNewJob: 'Publier un emploi',
    findCandidate: 'Trouver un nouveau candidat',
    myJobOffers: 'Mes offres d\'emploi',
    favoriteCandidates: 'Candidats favoris',
    contactCandidates: 'Contacter des candidats dans le monde entier sans limite',
    beFirst: 'Soyez la première offre dans la liste de recherche',
    respondMessages: 'Répondre sans limite à chaque nouveau message',
    seeVisitors: 'Voir qui a visité votre profil',
    upgradePremium: 'Passer à Premium',
    goPremium: 'Devenir Premium maintenant',
  },
  it: {
    helloPrefix: 'Bentornato, ', helloSuffix: '!',
    subtitle: 'Ecco cosa sta succedendo con il tuo reclutamento.',
    newMessages: (n: number) => n === 0 ? 'Nessun nuovo messaggio' : `${n} nuovi messaggi`,
    postNewJob: 'Pubblica un lavoro',
    findCandidate: 'Trova un nuovo candidato',
    myJobOffers: 'Le mie offerte di lavoro',
    favoriteCandidates: 'Candidati preferiti',
    contactCandidates: 'Contatta senza limiti candidati in tutto il mondo',
    beFirst: 'Sii la prima offerta nella lista di ricerca',
    respondMessages: 'Rispondi senza limiti a ogni nuovo messaggio',
    seeVisitors: 'Scopri chi ha visitato il tuo profilo',
    upgradePremium: 'Passa a Premium',
    goPremium: 'Diventa Premium ora',
  },
  sq: {
    helloPrefix: 'Mirë se u kthyet, ', helloSuffix: '!',
    subtitle: 'Ja çfarë po ndodh me rekrutimin tuaj.',
    newMessages: (n: number) => n === 0 ? 'Asnjë mesazh i ri' : `${n} mesazhe të reja`,
    postNewJob: 'Publiko punë të re',
    findCandidate: 'Gjeni kandidat të ri',
    myJobOffers: 'Ofertat e mia të punës',
    favoriteCandidates: 'Kandidatët e preferuar',
    contactCandidates: 'Kontaktoni pa kufizime kandidatët në mbarë botën',
    beFirst: 'Jini oferta e parë në listën e kërkimit',
    respondMessages: 'Përgjigjuni pa kufizime çdo mesazhi të ri',
    seeVisitors: 'Shikoni kush ka vizituar profilin tuaj',
    upgradePremium: 'Kaloni në Premium',
    goPremium: 'Bëhuni Premium tani',
  },
} as const;

export default function EmployerOverview() {
  const t = useTranslations('EmployerDashboard');
  const locale = useLocale() as keyof typeof ui;
  const loc = ui[locale] ?? ui.de;
  const [config, setConfig] = useState(() => getEmployerConfig());
  const [displayName, setDisplayName] = useState('');
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [activities, setActivities] = useState<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string }[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activeJobs, setActiveJobs] = useState<{ id: string; category: string; status: string }[]>([]);

  const loadConfig = useCallback(() => setConfig(getEmployerConfig()), []);

  useEffect(() => {
    loadConfig();
    window.addEventListener(CONFIG_UPDATED_EVENT, loadConfig);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, loadConfig);
  }, [loadConfig]);

  useEffect(() => {
    const session = getAuthSession();
    if (session) setDisplayName(getAuthDisplayName(session));
    setIsPremium(getIsPremium());
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.get<{ ok: boolean; count: number }>('/api/messages/unread-count', token)
      .then(res => { if (res.ok) setUnreadMsgCount(res.count); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { setActivitiesLoading(false); return; }
    api.get<{ ok: boolean; notifications: typeof activities }>('/api/notifications?limit=6', token)
      .then(res => { if (res.ok && res.notifications) setActivities(res.notifications); })
      .catch(() => {})
      .finally(() => setActivitiesLoading(false));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.get<{ ok: boolean; jobs: { id: string; category: string; status: string }[] }>('/api/jobs/mine', token)
      .then(res => { if (res.ok) setActiveJobs(res.jobs.filter(j => j.status === 'Active').slice(0, 4)); })
      .catch(() => {});
  }, []);

  // Short labels for the new "Profile visitors" quick-nav card — kept inline
  // so we don't touch the existing per-locale `ui` strings.
  const visitorsLabel = ({
    de: 'Besucher',
    en: 'Profile visitors',
    fr: 'Visiteurs',
    it: 'Visitatori',
    sq: 'Vizitorët',
  } as Record<string, string>)[locale] ?? 'Profile visitors';

  const quickNavItems = [
    { icon: MessageSquare, label: loc.newMessages(unreadMsgCount), href: '/dashboard/employer/messages', badge: unreadMsgCount > 0 ? unreadMsgCount : null, accent: false },
    { icon: Search, label: loc.findCandidate, href: '/dashboard/employer/candidates', badge: null, accent: false },
    { icon: Briefcase, label: loc.myJobOffers, href: '/dashboard/employer/jobs', badge: null, accent: false },
    { icon: Heart, label: loc.favoriteCandidates, href: '/dashboard/employer/favorites', badge: null, accent: false },
    { icon: Eye, label: visitorsLabel, href: '/dashboard/employer/profile-views', badge: null, accent: false },
    { icon: Plus, label: loc.postNewJob, href: '/dashboard/employer/jobs/new', badge: null, accent: true },
  ];

  const premiumBenefits = [
    { icon: Globe, text: loc.contactCandidates },
    { icon: Reply, text: loc.respondMessages },
    { icon: Eye, text: loc.seeVisitors },
    { icon: Crown, text: loc.beFirst },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Greeting */}
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F44] tracking-tight leading-tight mb-2">
          {displayName
            ? <>{loc.helloPrefix}<span className="bg-gradient-to-r from-[#F5C400] to-[#D4A200] bg-clip-text text-transparent">{displayName}</span>{loc.helloSuffix}</>
            : t('title')
          }
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium max-w-lg leading-relaxed">
          {loc.subtitle}
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 mb-8 sm:mb-12">
        {quickNavItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className={clsx(
                'group relative overflow-hidden transition-all duration-300 ease-out',
                /* Mobile: horizontal compact card */
                'flex flex-row items-center gap-4 rounded-2xl p-4',
                /* Tablet+: vertical tall card */
                'sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-3xl sm:p-6 lg:p-7 sm:min-h-[200px] lg:min-h-[220px] sm:justify-between',
                /* Hover */
                'hover:-translate-y-0.5 sm:hover:-translate-y-2',
                item.accent
                  ? 'bg-gradient-to-br from-[#0F1E45] via-[#162C66] to-[#1A3570] shadow-md sm:shadow-lg shadow-[#0F1E45]/20 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-[#0F1E45]/30 ring-1 ring-white/[0.06]'
                  : 'bg-gradient-to-br from-[#FFCF00] via-[#F5C400] to-[#E5B800] shadow-md sm:shadow-lg shadow-[#F5C400]/20 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-[#F5C400]/35'
              )}
            >
              {/* Decorative background elements — hidden on mobile for clean look */}
              <div className={clsx(
                'absolute -right-8 -bottom-8 w-36 h-36 sm:w-44 sm:h-44 rounded-full transition-transform duration-500 group-hover:scale-125 hidden sm:block',
                item.accent ? 'bg-[#F5C400]/[0.07]' : 'bg-white/[0.12]'
              )} />
              <div className={clsx(
                'absolute right-4 top-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full hidden sm:block',
                item.accent ? 'bg-white/[0.04]' : 'bg-white/[0.08]'
              )} />
              <div className={clsx(
                'absolute -left-4 top-1/2 w-20 h-20 rounded-full hidden sm:block',
                item.accent ? 'bg-[#F5C400]/[0.04]' : 'bg-white/[0.06]'
              )} />

              {/* Icon + Badge row (desktop) / Icon (mobile) */}
              <div className="relative z-10 flex items-start justify-between sm:mb-auto shrink-0">
                <div className={clsx(
                  'w-11 h-11 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 sm:group-hover:rotate-[-4deg] shadow-md sm:shadow-lg',
                  item.accent
                    ? 'bg-[#F5C400] text-[#0F1E45] shadow-[#F5C400]/25'
                    : 'bg-[#0F1E45] text-white shadow-[#0F1E45]/25'
                )}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" strokeWidth={1.8} />
                </div>
                {/* Badge — on mobile positioned absolute to icon, on desktop in flow */}
                {item.badge ? (
                  <span className="relative flex items-center justify-center absolute -top-1.5 -right-1.5 sm:static sm:top-auto sm:right-auto">
                    <span className="absolute w-3 h-3 bg-rose-500 rounded-full animate-ping opacity-40" />
                    <span className="relative w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs lg:text-sm font-bold shadow-md shadow-rose-500/30">
                      {item.badge}
                    </span>
                  </span>
                ) : (
                  <div className={clsx(
                    'w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 hidden sm:flex',
                    item.accent ? 'bg-white/10' : 'bg-[#0F1E45]/10'
                  )}>
                    <ArrowUpRight className={clsx('w-4 h-4', item.accent ? 'text-white' : 'text-[#0F1E45]')} />
                  </div>
                )}
              </div>

              {/* Label — inline on mobile, pill on desktop */}
              <div className="relative z-10 sm:mt-4 lg:mt-5 min-w-0">
                <span className={clsx(
                  'font-bold leading-snug',
                  /* Mobile: plain text */
                  'text-[13px]',
                  /* Desktop: pill badge */
                  'sm:inline-block sm:px-4 sm:py-2.5 sm:text-[13px] lg:text-[14px] sm:rounded-xl sm:shadow-md',
                  item.accent
                    ? 'text-[#F5C400] sm:bg-[#F5C400] sm:text-[#0F1E45] sm:shadow-[#F5C400]/20'
                    : 'text-[#0F1E45] sm:bg-[#0F1E45] sm:text-white sm:shadow-[#0F1E45]/15'
                )}>
                  {item.label}
                </span>
              </div>

              {/* Mobile-only arrow */}
              <div className={clsx(
                'sm:hidden ml-auto shrink-0',
                item.accent ? 'text-white/40' : 'text-[#0F1E45]/30'
              )}>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Left: Jobs + Activity */}
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          {config.dashboard.jobList && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#0B1F44]">{t('myActiveJobs')}</h3>
                <Link href="/dashboard/employer/jobs" className="text-sm font-medium text-slate-400 hover:text-[#0B1F44] transition-colors flex items-center gap-1">
                  {t('viewAll')}
                  <ArrowRight size={14} />
                </Link>
              </div>
              <JobList />
            </section>
          )}

          {/* Matching Candidates */}
          {activeJobs.length > 0 && (
            <section className="space-y-4">
              {activeJobs.map((job) => (
                <MatchingCandidates key={job.id} jobId={job.id} jobCategory={job.category} />
              ))}
            </section>
          )}

          {/* Activity Feed */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0B1F44]">{t('recentActivity')}</h3>
            </div>
            <Card className="p-0 overflow-hidden">
              {activitiesLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 mb-4">
                    <Clock size={22} />
                  </div>
                  <h4 className="text-sm font-semibold text-[#0B1F44] mb-1">{t('noActivityYet')}</h4>
                  <p className="text-[13px] text-slate-400 max-w-xs">{t('noActivityYetDesc')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {activities.map((activity) => {
                    const iconMap: Record<string, { icon: typeof Eye; color: string; bg: string }> = {
                      profile_view: { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                      new_message: { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      premium_activated: { icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
                      boost_active: { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
                      ad_online: { icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      premium_cancelled: { icon: Star, color: 'text-slate-500', bg: 'bg-slate-100' },
                    };
                    const { icon: Icon, color, bg } = iconMap[activity.type] || { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-100' };
                    const timeAgo = (() => {
                      const ms = Date.now() - new Date(activity.createdAt).getTime();
                      const mins = Math.floor(ms / 60000);
                      if (mins < 1) return locale === 'de' ? 'Gerade eben' : 'Just now';
                      if (mins < 60) return `${mins}m`;
                      const hours = Math.floor(mins / 60);
                      if (hours < 24) return `${hours}h`;
                      const days = Math.floor(hours / 24);
                      return `${days}d`;
                    })();
                    return (
                      <div key={activity.id} className={clsx('flex items-start gap-3 px-5 py-3.5 transition-colors', !activity.read && 'bg-blue-50/30')}>
                        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bg)}>
                          <Icon size={16} className={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#0B1F44] leading-snug">{getNotifTitle(activity, locale)}</p>
                          <p className="text-[12px] text-slate-400 font-medium mt-0.5 truncate">{getNotifBody(activity, locale)}</p>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium shrink-0 mt-0.5">{timeAgo}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* Right Sidebar: Recent Candidates + Premium */}
        <div className="space-y-5 sm:space-y-6">
          {/* Premium Upgrade Card – hidden if already premium */}
          {!isPremium && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#162C66] to-[#0F1E45] p-5 sm:p-6">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#F5C400]/15 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/3" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-[#F5C400] rounded-xl flex items-center justify-center text-[#162C66] mb-4 shadow-lg shadow-[#F5C400]/20">
                  <Crown size={20} />
                </div>
                <h4 className="text-white font-bold text-lg mb-3">{loc.upgradePremium}</h4>
                <div className="space-y-2.5 mb-5">
                  {premiumBenefits.map((b, i) => {
                    const BIcon = b.icon;
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <BIcon size={15} className="text-[#F5C400] shrink-0 mt-0.5" />
                        <span className="text-[13px] font-medium text-white/70 leading-snug">{b.text}</span>
                      </div>
                    );
                  })}
                </div>
                <Link
                  href="/dashboard/employer/premium"
                  className="block w-full text-center py-3 bg-[#F5C400] text-[#162C66] font-bold text-[15px] rounded-xl hover:bg-[#ffe533] transition-all shadow-lg shadow-[#F5C400]/20"
                >
                  {loc.goPremium}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
