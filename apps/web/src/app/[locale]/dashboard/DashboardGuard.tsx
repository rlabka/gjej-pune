'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { getSession, getToken, logout } from '@/lib/auth';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import { api } from '@/lib/api';
import { FileEdit, Briefcase, Plus, AlertTriangle, LogOut } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Link } from '@/i18n/routing';
import LoadingScreen from '@/components/ui/LoadingScreen';

type Props = { children: React.ReactNode };

const onboardingText = {
  de: {
    badge: 'Noch ein Schritt',
    titleJobSeeker: 'Erstellen Sie Ihr Jobprofil',
    titleEmployer: 'Erstellen Sie Ihre erste Stellenanzeige',
    descJobSeeker: 'Damit Arbeitgeber Sie finden können, brauchen Sie ein Jobprofil. Erstellen Sie es jetzt — es dauert nur wenige Minuten.',
    descEmployer: 'Damit Kandidaten Sie finden können, brauchen Sie eine Stellenanzeige. Erstellen Sie jetzt Ihr erstes Inserat — es dauert nur wenige Minuten.',
    ctaJobSeeker: 'Jobprofil erstellen',
    ctaEmployer: 'Stellenanzeige erstellen',
    stepsJobSeeker: ['Konto erstellt', 'Jobprofil erstellen', 'Dashboard nutzen'],
    stepsEmployer: ['Konto erstellt', 'Stellenanzeige erstellen', 'Dashboard nutzen'],
  },
  en: {
    badge: 'One more step',
    titleJobSeeker: 'Create your job profile',
    titleEmployer: 'Create your first job listing',
    descJobSeeker: 'So employers can find you, you need a job profile. Create your job profile now — it only takes a few minutes.',
    descEmployer: 'So candidates can find you, you need a job listing. Create your first posting now — it only takes a few minutes.',
    ctaJobSeeker: 'Create Job Profile',
    ctaEmployer: 'Create Job Listing',
    stepsJobSeeker: ['Account created', 'Create job profile', 'Use dashboard'],
    stepsEmployer: ['Account created', 'Create job listing', 'Use dashboard'],
  },
  fr: {
    badge: 'Encore une étape',
    titleJobSeeker: 'Créez votre profil emploi',
    titleEmployer: 'Créez votre première offre d\'emploi',
    descJobSeeker: 'Pour que les employeurs vous trouvent, créez votre profil emploi. Cela ne prend que quelques minutes.',
    descEmployer: 'Pour que les candidats vous trouvent, créez votre première offre. Cela ne prend que quelques minutes.',
    ctaJobSeeker: 'Créer un profil emploi',
    ctaEmployer: 'Créer une offre d\'emploi',
    stepsJobSeeker: ['Compte créé', 'Créer profil emploi', 'Utiliser le dashboard'],
    stepsEmployer: ['Compte créé', 'Créer une offre', 'Utiliser le dashboard'],
  },
  it: {
    badge: 'Ancora un passo',
    titleJobSeeker: 'Crea il tuo profilo lavoro',
    titleEmployer: 'Crea il tuo primo annuncio',
    descJobSeeker: 'Per farti trovare dai datori di lavoro, crea il tuo profilo lavoro. Ci vogliono solo pochi minuti.',
    descEmployer: 'Per farti trovare dai candidati, crea il tuo primo annuncio. Ci vogliono solo pochi minuti.',
    ctaJobSeeker: 'Crea profilo lavoro',
    ctaEmployer: 'Crea annuncio di lavoro',
    stepsJobSeeker: ['Account creato', 'Crea profilo lavoro', 'Usa la dashboard'],
    stepsEmployer: ['Account creato', 'Crea annuncio', 'Usa la dashboard'],
  },
  sq: {
    badge: 'Edhe një hap',
    titleJobSeeker: 'Krijoni profilin tuaj të punës',
    titleEmployer: 'Krijoni shpalljen tuaj të parë',
    descJobSeeker: 'Që punëdhënësit t\'ju gjejnë, krijoni profilin tuaj të punës. Duhen vetëm disa minuta.',
    descEmployer: 'Që kandidatët t\'ju gjejnë, krijoni shpalljen tuaj të parë. Duhen vetëm disa minuta.',
    ctaJobSeeker: 'Krijo profil pune',
    ctaEmployer: 'Krijo shpallje pune',
    stepsJobSeeker: ['Llogaria u krijua', 'Krijo profilin e punës', 'Përdor dashboard-in'],
    stepsEmployer: ['Llogaria u krijua', 'Krijo shpalljen', 'Përdor dashboard-in'],
  },
} as const;

export default function DashboardGuard({ children }: Props) {
  const t = useTranslations('auth.guard');
  const locale = useLocale() as keyof typeof onboardingText;
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const requiredRole = useMemo(() => {
    if (pathname.includes('/dashboard/employer')) return 'employer';
    if (pathname.includes('/dashboard/job-seeker')) return 'job-seeker';
    return null;
  }, [pathname]);

  // Pages allowed through even during onboarding (creation, settings, profile)
  const isAllowedPage = useMemo(() => {
    // Ad/job creation pages
    if (pathname.includes('/dashboard/job-seeker/my-ads')) return true;
    if (pathname.includes('/dashboard/employer/jobs/new')) return true;
    // Settings & profile
    if (pathname.includes('/dashboard/job-seeker/settings')) return true;
    if (pathname.includes('/dashboard/employer/settings')) return true;
    if (pathname.includes('/dashboard/job-seeker/profile')) return true;
    if (pathname.includes('/dashboard/employer/company')) return true;
    return false;
  }, [pathname]);

  useEffect(() => {
    // Reset to loading state on every re-run to prevent stale onboarding overlay flash
    setReady(false);

    const session = getSession();
    if (!session?.isAuthenticated) {
      router.replace('/auth/login', { locale });
      return;
    }

    if (session.role === 'admin') {
      router.replace('/admin', { locale });
      return;
    }
    // If a user is authenticated but navigates to the wrong dashboard for their role,
    // route them to the correct dashboard root.
    if (requiredRole && session.role !== requiredRole) {
      router.replace(session.role === 'employer' ? '/dashboard/employer' : '/dashboard/job-seeker', { locale });
      return;
    }

    // Banned job-seekers: log out and redirect to login
    if (session.role === 'job-seeker' && requiredRole === 'job-seeker') {
      const jsConfig = getJobSeekerConfig();
      const emailLower = session.email?.toLowerCase() ?? '';
      if (jsConfig.access.bannedEmails.some((e) => e.toLowerCase() === emailLower)) {
        logout().then(() => {
          window.location.href = `/${locale}/auth/login?reason=banned`;
        });
        return;
      }
    }

    // Check if user has created at least one listing
    const token = getToken();
    if (token && requiredRole) {
      const endpoint = requiredRole === 'employer' ? '/api/jobs/mine' : '/api/ads/mine';
      api.get<{ ok: boolean; jobs?: unknown[]; ads?: unknown[] }>(endpoint, token)
        .then((res) => {
          const items = requiredRole === 'employer' ? res.jobs : res.ads;
          const hasItems = res.ok && items && items.length > 0;
          setNeedsOnboarding(!hasItems);
          setReady(true);
        })
        .catch(() => {
          // If API fails, let them through
          setReady(true);
        });
    } else {
      setReady(true);
    }
  }, [locale, requiredRole, router, pathname]);

  if (!ready) {
    return <LoadingScreen variant="section" />;
  }

  // If user needs onboarding AND is not on a creation page, show overlay — no redirect
  if (needsOnboarding && !isAllowedPage) {
    const loc = onboardingText[locale] ?? onboardingText.de;
    const isEmployer = requiredRole === 'employer';
    const Icon = isEmployer ? Briefcase : FileEdit;

    return (
      <div className="min-h-screen flex flex-col bg-slate-50/50">
        {/* Compact header */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="gjejpune24" className="h-7 sm:h-8 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <div className="h-6 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => { logout().then(() => { window.location.href = `/${locale}/auth/login`; }); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{locale === 'de' ? 'Abmelden' : locale === 'fr' ? 'Déconnexion' : locale === 'it' ? 'Esci' : locale === 'sq' ? 'Dil' : 'Logout'}</span>
            </button>
          </div>
        </header>

        {/* Onboarding content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]">
            {/* Gradient header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#162C66] via-[#1a3578] to-[#0F1E45] px-6 sm:px-8 pt-8 pb-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE0YzAtMS4xLS45LTItMi0yaC00Yy0xLjEgMC0yIC45LTIgMnY0YzAgMS4xLjkgMiAyIDJoNGMxLjEgMCAyLS45IDItMnYtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
              <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-[#F5C400]/15 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/4" />

              <div className="relative z-10">
                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5C400]/20 text-[#F5C400] text-[11px] font-bold uppercase tracking-wider rounded-full mb-5">
                  <span className="w-1.5 h-1.5 bg-[#F5C400] rounded-full animate-pulse" />
                  {loc.badge}
                </span>

                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight mb-2">
                  {isEmployer ? loc.titleEmployer : loc.titleJobSeeker}
                </h2>
                <p className="text-[13px] sm:text-sm text-white/60 font-medium leading-relaxed max-w-sm">
                  {isEmployer ? loc.descEmployer : loc.descJobSeeker}
                </p>
              </div>
            </div>

            {/* Step progress */}
            <div className="px-6 sm:px-8 py-6 border-b border-slate-100">
              <div className="flex items-start justify-between relative">
                {/* Lines behind steps */}
                <div className="absolute top-[15px] left-[10%] right-[10%] h-[2px] bg-slate-200 z-0" />
                <div className="absolute top-[15px] left-[10%] right-[50%] h-[2px] bg-gradient-to-r from-emerald-300 to-[#162C66]/30 z-0" />

                {(isEmployer ? loc.stepsEmployer : loc.stepsJobSeeker).map((step, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                      i === 0
                        ? 'bg-emerald-100 text-emerald-600 ring-[4px] ring-white shadow-[0_0_0_6px_#bbf7d0]'
                        : i === 1
                          ? 'bg-[#162C66] text-white ring-[4px] ring-white shadow-md shadow-[#162C66]/30'
                          : 'bg-slate-100 text-slate-400 ring-[4px] ring-white'
                    }`}>
                      {i === 0 ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-semibold mt-2.5 text-center leading-tight ${
                      i === 0 ? 'text-emerald-600' : i === 1 ? 'text-[#162C66]' : 'text-slate-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA area */}
            <div className="px-6 sm:px-8 py-6 sm:py-8 text-center">
              <button
                type="button"
                onClick={() => {
                  router.push(isEmployer ? '/dashboard/employer/jobs/new' : '/dashboard/job-seeker/my-ads?create=1', { locale });
                }}
                className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#162C66] text-white text-sm font-bold rounded-xl hover:bg-[#0F1E45] transition-all duration-300 shadow-lg shadow-[#162C66]/25 hover:shadow-xl hover:shadow-[#162C66]/30 hover:-translate-y-0.5"
              >
                <Icon size={18} />
                {isEmployer ? loc.ctaEmployer : loc.ctaJobSeeker}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

