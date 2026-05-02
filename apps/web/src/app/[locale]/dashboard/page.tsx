'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { getSession } from '@/lib/auth';
import { User, Building2, ArrowRight, Search, FileText, MessageSquare, Briefcase, Users, BarChart3 } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';

export const dynamic = 'force-dynamic';

const copy = {
  de: {
    title: 'Willkommen zurück',
    subtitle: 'Welchen Bereich möchten Sie öffnen?',
    jobSeeker: 'Jobsuchende',
    jobSeekerDesc: 'Jobs finden, Bewerbungen verwalten und Nachrichten lesen.',
    jobSeekerFeatures: ['Jobs durchsuchen', 'Bewerbungen verwalten', 'Nachrichten'],
    employer: 'Arbeitgeber',
    employerDesc: 'Stellen ausschreiben, Kandidaten finden und verwalten.',
    employerFeatures: ['Stellen veröffentlichen', 'Kandidaten finden', 'Statistiken'],
  },
  en: {
    title: 'Welcome back',
    subtitle: 'Which area would you like to open?',
    jobSeeker: 'Job Seeker',
    jobSeekerDesc: 'Find jobs, manage applications and read messages.',
    jobSeekerFeatures: ['Browse jobs', 'Manage applications', 'Messages'],
    employer: 'Employer',
    employerDesc: 'Post jobs, find candidates and manage hiring.',
    employerFeatures: ['Post jobs', 'Find candidates', 'Analytics'],
  },
  fr: {
    title: 'Bon retour',
    subtitle: 'Quel espace souhaitez-vous ouvrir ?',
    jobSeeker: 'Chercheur d\'emploi',
    jobSeekerDesc: 'Trouver des emplois, gérer les candidatures et les messages.',
    jobSeekerFeatures: ['Parcourir les offres', 'Gérer candidatures', 'Messages'],
    employer: 'Employeur',
    employerDesc: 'Publier des offres, trouver des candidats et recruter.',
    employerFeatures: ['Publier offres', 'Trouver candidats', 'Statistiques'],
  },
  it: {
    title: 'Bentornato',
    subtitle: 'Quale area vuoi aprire?',
    jobSeeker: 'Candidato',
    jobSeekerDesc: 'Cerca lavoro, gestisci candidature e messaggi.',
    jobSeekerFeatures: ['Cerca lavoro', 'Gestisci candidature', 'Messaggi'],
    employer: 'Datore di lavoro',
    employerDesc: 'Pubblica offerte, trova candidati e gestisci assunzioni.',
    employerFeatures: ['Pubblica offerte', 'Trova candidati', 'Statistiche'],
  },
  sq: {
    title: 'Mirë se u kthyet',
    subtitle: 'Cilin seksion dëshironi të hapni?',
    jobSeeker: 'Punëkërkues',
    jobSeekerDesc: 'Gjeni punë, menaxhoni aplikimet dhe mesazhet.',
    jobSeekerFeatures: ['Kërko punë', 'Menaxho aplikimet', 'Mesazhet'],
    employer: 'Punëdhënës',
    employerDesc: 'Publikoni punë, gjeni kandidatë dhe menaxhoni rekrutimin.',
    employerFeatures: ['Publiko punë', 'Gjej kandidatë', 'Statistikat'],
  },
} as const;

const jsIcons = [Search, FileText, MessageSquare];
const empIcons = [Briefcase, Users, BarChart3];

export default function DashboardRootPage() {
  const locale = useLocale() as keyof typeof copy;
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.isAuthenticated) {
      router.replace('/auth/login', { locale });
      return;
    }
    // Auto-redirect if user already has a role
    if (session.role === 'employer') {
      router.replace('/dashboard/employer', { locale });
      return;
    }
    if (session.role === 'job-seeker') {
      router.replace('/dashboard/job-seeker', { locale });
      return;
    }
    if (session.role === 'admin') {
      router.replace('/admin', { locale });
      return;
    }
    setReady(true);
  }, [locale, router]);

  const t = copy[locale] ?? copy.de;

  if (!ready) {
    return <LoadingScreen variant="page" />;
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-[#162C66] to-[#1a3578] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#162C66]/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F44] tracking-tight">
            {t.title}
          </h1>
          <p className="mt-2 text-sm sm:text-[15px] text-slate-500 font-medium">
            {t.subtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Job Seeker */}
          <Link
            href="/dashboard/job-seeker"
            className="group relative overflow-hidden bg-white rounded-2xl border-2 border-slate-200/80 p-6 hover:border-[#162C66] hover:shadow-[0_12px_40px_-12px_rgba(22,44,102,0.15)] transition-all duration-300"
          >
            <div className="w-12 h-12 bg-[#162C66]/[0.06] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#162C66]/10 transition-colors">
              <User size={24} className="text-[#162C66]" />
            </div>
            <h3 className="text-base font-extrabold text-[#0B1F44] mb-1.5">{t.jobSeeker}</h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-4">{t.jobSeekerDesc}</p>
            <div className="space-y-2 mb-5">
              {t.jobSeekerFeatures.map((f, i) => {
                const Icon = jsIcons[i];
                return (
                  <div key={i} className="flex items-center gap-2.5 text-[12px] font-semibold text-slate-400">
                    <Icon size={14} className="text-[#162C66]/40" />
                    {f}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#162C66] group-hover:gap-2.5 transition-all">
              {locale === 'de' ? 'Öffnen' : locale === 'fr' ? 'Ouvrir' : locale === 'it' ? 'Apri' : locale === 'sq' ? 'Hap' : 'Open'}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Employer */}
          <Link
            href="/dashboard/employer"
            className="group relative overflow-hidden bg-white rounded-2xl border-2 border-slate-200/80 p-6 hover:border-[#162C66] hover:shadow-[0_12px_40px_-12px_rgba(22,44,102,0.15)] transition-all duration-300"
          >
            <div className="w-12 h-12 bg-[#162C66]/[0.06] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#162C66]/10 transition-colors">
              <Building2 size={24} className="text-[#162C66]" />
            </div>
            <h3 className="text-base font-extrabold text-[#0B1F44] mb-1.5">{t.employer}</h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-4">{t.employerDesc}</p>
            <div className="space-y-2 mb-5">
              {t.employerFeatures.map((f, i) => {
                const Icon = empIcons[i];
                return (
                  <div key={i} className="flex items-center gap-2.5 text-[12px] font-semibold text-slate-400">
                    <Icon size={14} className="text-[#162C66]/40" />
                    {f}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#162C66] group-hover:gap-2.5 transition-all">
              {locale === 'de' ? 'Öffnen' : locale === 'fr' ? 'Ouvrir' : locale === 'it' ? 'Apri' : locale === 'sq' ? 'Hap' : 'Open'}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

