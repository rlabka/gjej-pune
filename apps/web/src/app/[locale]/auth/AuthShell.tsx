'use client';

import type { ReactNode } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { ArrowLeft, ShieldCheck, MapPin } from 'lucide-react';
import { getThemeConfig, CONFIG_UPDATED_EVENT, DEFAULT_THEME } from '@/lib/siteConfig';
import { useEffect, useState } from 'react';

export default function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations('auth.common');
  const locale = useLocale();
  // IMPORTANT: Avoid hydration mismatch by rendering stable defaults first.
  // Theme config can differ between server HTML and client (localStorage).
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    setTheme(getThemeConfig());
    const handler = () => setTheme(getThemeConfig());
    window.addEventListener(CONFIG_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handler);
  }, []);

  const marketing = {
    de: {
      title: 'Finde schneller einen Job!',
      subtitle: 'Eine ruhige, professionelle Plattform für Jobs in Europa — effizient, sicher und vertrauenswürdig.',
      back: 'Zurück zur Startseite',
      trust: 'Sicher & vertrauenswürdig',
      region: 'Jobs in Europa',
    },
    en: {
      title: 'Find your next job faster!',
      subtitle: 'A calm, professional platform for jobs in Europe — efficient, secure, and trustworthy.',
      back: 'Back to home',
      trust: 'Secure & trustworthy',
      region: 'Jobs in Europe',
    },
    fr: {
      title: 'Trouvez votre prochain job plus vite !',
      subtitle: 'Une plateforme calme et professionnelle pour l\u2019Europe — efficace, sécurisée et fiable.',
      back: 'Retour à l\u2019accueil',
      trust: 'Sûr & fiable',
      region: 'Emplois en Europe',
    },
    it: {
      title: 'Trova lavoro più velocemente!',
      subtitle: 'Una piattaforma calma e professionale per l\u2019Europa — efficiente, sicura e affidabile.',
      back: 'Torna alla home',
      trust: 'Sicuro & affidabile',
      region: 'Lavoro in Europa',
    },
    sq: {
      title: 'Gjej punë më shpejt!',
      subtitle: 'Një platformë e qetë dhe profesionale për punë në Evropë — efikase, e sigurt dhe e besueshme.',
      back: 'Kthehu në faqen kryesore',
      trust: 'E sigurt & e besueshme',
      region: 'Punë në Evropë',
    },
  } as const;

  const m = marketing[(locale as keyof typeof marketing) ?? 'de'] ?? marketing.de;
  const siteName = theme.siteName || 'gjej-pune.com';
  const logoUrl = theme.logoUrl || '/logo.png';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Global Header */}
      <header className="w-full h-16 sm:h-20 px-4 sm:px-8 lg:px-10 flex items-center justify-between bg-white border-b border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sticky top-0 z-50">
        <Link
          href="/"
          aria-label={t('brand')}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 rounded-lg"
        >
          <img src={logoUrl} alt={siteName} className="h-8 sm:h-9 w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#162C66] transition-colors duration-200"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">{m.back}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start lg:items-center justify-center px-0 sm:px-6 lg:px-8 py-0 sm:py-8 lg:py-12">
        <div className="w-full max-w-[1200px]">
          <div className="bg-white sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-none sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] sm:border sm:border-slate-200/60">
            <div className="grid lg:grid-cols-[1fr_1.1fr] min-h-[calc(100vh-4rem)] sm:min-h-0 lg:min-h-[680px]">

              {/* Left marketing panel — hidden on mobile/tablet */}
              <div className="hidden lg:flex relative overflow-hidden bg-[#0B1F44] flex-col justify-between p-10 xl:p-14">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#081737] via-[#0B1F44] to-[#122B5E]" />
                <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-3xl" />
                <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full bg-[#162C66]/30 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/[0.04] blur-3xl" />

                {/* Content */}
                <div className="relative z-10">
                  <h2 className="text-[28px] xl:text-[36px] leading-[1.15] font-extrabold tracking-tight text-white mb-5">
                    {m.title}
                  </h2>
                  <p className="text-[15px] xl:text-[16px] leading-relaxed font-medium text-blue-100/70 max-w-[380px]">
                    {m.subtitle}
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="relative z-10 mt-auto pt-10 space-y-4">
                  {[
                    { icon: <ShieldCheck size={20} className="text-emerald-400" />, text: m.trust },
                    { icon: <MapPin size={20} className="text-blue-300" />, text: m.region },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-xl bg-white/[0.06] border border-white/[0.08] px-5 py-3.5 backdrop-blur-sm">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-white/[0.08] flex items-center justify-center">
                        {item.icon}
                      </div>
                      <span className="text-[14px] xl:text-[15px] font-semibold text-white/80">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right form panel */}
              <div className="flex flex-col min-h-0">
                {/* Mobile/Tablet branding strip — visible only below lg */}
                <div className="lg:hidden bg-gradient-to-r from-[#0B1F44] via-[#122B5E] to-[#0B1F44] px-5 py-5 sm:px-8 sm:py-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                    {m.title}
                  </h2>
                  <p className="mt-1.5 text-[13px] sm:text-sm font-medium text-blue-100/60 leading-relaxed max-w-md">
                    {m.subtitle}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-[11px] sm:text-xs font-medium text-white/45">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400/70" />
                      {m.trust}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/15" />
                    <div>{m.region}</div>
                  </div>
                </div>

                {/* Form area */}
                <div className="flex-1 flex items-start sm:items-center justify-center px-5 py-6 sm:px-8 sm:py-10 lg:px-12 xl:px-16 lg:py-12">
                  <div className="w-full max-w-[440px] mx-auto relative z-10">{children}</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
