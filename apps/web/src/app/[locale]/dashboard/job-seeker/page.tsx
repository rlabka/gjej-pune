'use client';

import RecommendedJobs from '@/components/dashboard/job-seeker/RecommendedJobs';
import ApplicationsList from '@/components/dashboard/job-seeker/ApplicationsList';
import ProfileCompletion from '@/components/dashboard/job-seeker/ProfileCompletion';
import { Briefcase, FileText, Search, Zap, ArrowUpRight, ArrowRight, Sparkles, Plus, MessageSquare, Heart, User, Crown, Check, Globe, Reply, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/shared/EmptyState';
import { useCallback, useEffect, useRef, useState } from 'react';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import { CONFIG_UPDATED_EVENT } from '@/lib/siteConfig';
import { getSession, getDisplayName, getToken, getIsPremium } from '@/lib/auth';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

const ui = {
  de: {
    hello: (name: string) => `Hallo, ${name}!`,
    helloPrefix: 'Hallo, ', helloSuffix: '!',
    subtitle: 'Hier ist, was heute mit Ihrer Jobsuche passiert.',
    newMessages: (n: number) => `${n} neue Nachrichten`,
    searchJob: 'Neuen Job suchen',
    myProfiles: 'Meine Jobprofile',
    favoriteJobs: 'Gespeicherte Jobs',
    createProfile: 'Neues Job\u2011profil erstellen',
    contactEmployers: 'Arbeitgeber weltweit unbegrenzt kontaktieren',
    respondMessages: 'Auf jede neue Nachricht antworten',
    seeVisitors: 'Sehen, wer dein Profil besucht hat',
    beFirst: 'Sei der Erste auf der Kandidatenliste',
    upgradePremium: 'Auf Premium upgraden',
    goPremium: 'Jetzt Premium werden',
  },
  en: {
    hello: (name: string) => `Hello, ${name}!`,
    helloPrefix: 'Hello, ', helloSuffix: '!',
    subtitle: 'Here is what\'s happening with your job search today.',
    newMessages: (n: number) => `${n} new messages`,
    searchJob: 'Search for a new Job',
    myProfiles: 'My job profiles',
    favoriteJobs: 'Favorite Jobs',
    createProfile: 'Create new Job Profile',
    contactEmployers: 'Contact without limit employers worldwide',
    respondMessages: 'Respond to every new message',
    seeVisitors: 'See who visited your profile',
    beFirst: 'Be the first on the searching list of candidates',
    upgradePremium: 'Upgrade to Premium',
    goPremium: 'Go Premium Now',
  },
  fr: {
    hello: (name: string) => `Bonjour, ${name}!`,
    helloPrefix: 'Bonjour, ', helloSuffix: ' !',
    subtitle: 'Voici ce qui se passe avec votre recherche d\'emploi aujourd\'hui.',
    newMessages: (n: number) => `${n} nouveaux messages`,
    searchJob: 'Rechercher un emploi',
    myProfiles: 'Mes profils emploi',
    favoriteJobs: 'Emplois favoris',
    createProfile: 'Créer un nouveau profil emploi',
    contactEmployers: 'Contacter des employeurs dans le monde entier sans limite',
    respondMessages: 'Répondre à chaque nouveau message',
    seeVisitors: 'Voir qui a visité votre profil',
    beFirst: 'Soyez le premier sur la liste de recherche',
    upgradePremium: 'Passer à Premium',
    goPremium: 'Devenir Premium maintenant',
  },
  it: {
    hello: (name: string) => `Ciao, ${name}!`,
    helloPrefix: 'Ciao, ', helloSuffix: '!',
    subtitle: 'Ecco cosa succede oggi con la tua ricerca di lavoro.',
    newMessages: (n: number) => `${n} nuovi messaggi`,
    searchJob: 'Cerca un nuovo lavoro',
    myProfiles: 'I miei profili lavoro',
    favoriteJobs: 'Lavori preferiti',
    createProfile: 'Crea un nuovo profilo lavoro',
    contactEmployers: 'Contatta senza limiti i datori di lavoro in tutto il mondo',
    respondMessages: 'Rispondi a ogni nuovo messaggio',
    seeVisitors: 'Scopri chi ha visitato il tuo profilo',
    beFirst: 'Sii il primo nella lista di ricerca dei candidati',
    upgradePremium: 'Passa a Premium',
    goPremium: 'Diventa Premium ora',
  },
  sq: {
    hello: (name: string) => `Përshëndetje, ${name}!`,
    helloPrefix: 'Përshëndetje, ', helloSuffix: '!',
    subtitle: 'Ja çfarë po ndodh sot me kërkimin tuaj të punës.',
    newMessages: (n: number) => `${n} mesazhe të reja`,
    searchJob: 'Kërko një punë të re',
    myProfiles: 'Profilet e mia të punës',
    favoriteJobs: 'Punët e preferuara',
    createProfile: 'Krijo një profil të ri pune',
    contactEmployers: 'Kontaktoni pa kufizime punëdhënësit në mbarë botën',
    respondMessages: 'Përgjigjuni çdo mesazhi të ri',
    seeVisitors: 'Shikoni kush ka vizituar profilin tuaj',
    beFirst: 'Jini i pari në listën e kërkimit të kandidatëve',
    upgradePremium: 'Kaloni në Premium',
    goPremium: 'Bëhuni Premium tani',
  },
} as const;

export default function JobSeekerDashboardPage() {
  const locale = useLocale() as keyof typeof ui;
  const loc = ui[locale] ?? ui.de;
  const t = useTranslations('Dashboard.overview');
  const emptyT = useTranslations('jobSeeker.empty');
  const feedbackT = useTranslations('jobSeeker.feedback');
  const recommendedWrapRef = useRef<HTMLDivElement | null>(null);
  const [hasRecommendedJobs, setHasRecommendedJobs] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [config, setConfig] = useState(() => getJobSeekerConfig());
  const [displayName, setDisplayName] = useState('');
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  const loadConfig = useCallback(() => setConfig(getJobSeekerConfig()), []);

  useEffect(() => {
    loadConfig();
    window.addEventListener(CONFIG_UPDATED_EVENT, loadConfig);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, loadConfig);
  }, [loadConfig]);

  useEffect(() => {
    const session = getSession();
    if (session) setDisplayName(getDisplayName(session));
    setIsPremium(getIsPremium());
    // Fetch real unread message count
    const token = getToken();
    if (token) {
      api.get<{ ok: boolean; count: number }>('/api/messages/unread-count', token)
        .then(res => { if (res.ok) setUnreadMsgCount(res.count); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const wrap = recommendedWrapRef.current;
    const root = wrap?.firstElementChild;
    setHasRecommendedJobs(!!root && root.children.length > 0);
  }, []);

  const visitorsLabel = ({
    de: 'Besucher',
    en: 'Profile visitors',
    fr: 'Visiteurs',
    it: 'Visitatori',
    sq: 'Vizitorët',
  } as Record<string, string>)[locale] ?? 'Profile visitors';

  const quickNavItems = [
    { icon: MessageSquare, label: loc.newMessages(unreadMsgCount), href: '/dashboard/job-seeker/messages', badge: unreadMsgCount || null, accent: false },
    { icon: Search, label: loc.searchJob, href: '/jobs', badge: null, accent: false },
    { icon: User, label: loc.myProfiles, href: '/dashboard/job-seeker/my-ads', badge: null, accent: false },
    { icon: Heart, label: loc.favoriteJobs, href: '/dashboard/job-seeker/saved', badge: null, accent: false },
    { icon: Eye, label: visitorsLabel, href: '/dashboard/job-seeker/profile-views', badge: null, accent: false },
    { icon: Plus, label: loc.createProfile, href: '/dashboard/job-seeker/my-ads?create=1', badge: null, accent: true },
  ];

  const premiumBenefits = [
    { icon: Globe, text: loc.contactEmployers },
    { icon: Reply, text: loc.respondMessages },
    { icon: Eye, text: loc.seeVisitors },
    { icon: Crown, text: loc.beFirst },
  ];

  return (
    <>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Recommended Jobs */}
          {config.dashboard.recommendedJobs && (
            <section>
              <div className="flex justify-between items-center mb-4 sm:mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#162C66]/[0.06] rounded-lg flex items-center justify-center">
                    <Sparkles size={16} className="text-[#162C66]" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0B1F44]">{t('recommendedForYou')}</h2>
                </div>
                <Link href="/jobs" className="group flex items-center gap-1 text-sm font-semibold text-[#162C66] hover:text-[#0F1E45] transition-colors">
                  <span>{t('viewAll')}</span>
                  <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
              {hasRecommendedJobs ? (
                <div ref={recommendedWrapRef}>
                  <RecommendedJobs />
                </div>
              ) : (
                <Card className="p-0 overflow-hidden border border-slate-100 shadow-sm">
                  <EmptyState
                    title={emptyT('dashboardRecommended.title')}
                    description={emptyT('dashboardRecommended.description')}
                    icon={<Search size={48} />}
                    action={
                      <Link href="/jobs">
                        <Button variant="primary">
                          <Briefcase size={18} />
                          <span>{emptyT('cta.browseJobs')}</span>
                        </Button>
                      </Link>
                    }
                  />
                </Card>
              )}
            </section>
          )}

          {/* Recent Applications */}
          {config.dashboard.recentApplications && (
            <section>
              <div className="flex justify-between items-center mb-4 sm:mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#162C66]/[0.06] rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-[#162C66]" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0B1F44]">{t('recentApplications')}</h2>
                </div>
                <Link href="/dashboard/job-seeker/applications" className="group flex items-center gap-1 text-sm font-semibold text-[#162C66] hover:text-[#0F1E45] transition-colors">
                  <span>{t('trackAll')}</span>
                  <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
              <ApplicationsList />
            </section>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-5 sm:space-y-6">
          {/* Profile Completion */}
          {config.dashboard.profileCompletion && <ProfileCompletion />}

          {/* Premium Upgrade Card removed – job seekers use all features for free */}
        </div>
      </div>
    </>
  );
}
