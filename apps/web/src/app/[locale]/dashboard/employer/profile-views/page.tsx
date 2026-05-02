'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Eye, Crown, Lock, ArrowLeft, User, MessageSquare } from 'lucide-react';
import { getToken, getIsPremium } from '@/lib/auth';
import { api } from '@/lib/api';
import { clsx } from 'clsx';

export const dynamic = 'force-dynamic';

type Viewer = {
  id: string;
  viewerId: string;
  viewerName: string;
  viewerImage: string | null;
  viewerRole: string;
  targetType: string;
  targetId: string;
  createdAt: string;
};

const loc = {
  de: {
    back: 'Zurück zum Dashboard',
    title: 'Profilbesuche',
    subtitle: 'Sehe wer deine Stellenangebote angesehen hat.',
    noViews: 'Noch keine Besuche registriert.',
    viewedYour: 'hat dein',
    job: 'Stellenangebot',
    ad: 'Jobprofil',
    viewed: 'angesehen',
    lockedTitle: 'Premium-Feature',
    lockedDesc: 'Schalte Premium frei, um zu sehen, wer deine Inserate besucht hat.',
    lockedCount: (n: number) => `${n} Besucher insgesamt`,
    upgrade: 'Premium freischalten',
    contact: 'Kontaktieren',
  },
  en: {
    back: 'Back to Dashboard',
    title: 'Profile Views',
    subtitle: 'See who viewed your job listings.',
    noViews: 'No views recorded yet.',
    viewedYour: 'viewed your',
    job: 'job listing',
    ad: 'job profile',
    viewed: '',
    lockedTitle: 'Premium Feature',
    lockedDesc: 'Unlock Premium to see who visited your listings.',
    lockedCount: (n: number) => `${n} visitors total`,
    upgrade: 'Unlock Premium',
    contact: 'Contact',
  },
  fr: {
    back: 'Retour au tableau de bord',
    title: 'Visites de profil',
    subtitle: 'Voir qui a consulté vos offres d\'emploi.',
    noViews: 'Aucune visite enregistrée.',
    viewedYour: 'a consulté votre',
    job: 'offre d\'emploi',
    ad: 'profil',
    viewed: '',
    lockedTitle: 'Fonctionnalité Premium',
    lockedDesc: 'Débloquez Premium pour voir qui a visité vos annonces.',
    lockedCount: (n: number) => `${n} visiteurs au total`,
    upgrade: 'Débloquer Premium',
    contact: 'Contacter',
  },
  it: {
    back: 'Torna alla dashboard',
    title: 'Visite al profilo',
    subtitle: 'Scopri chi ha visualizzato i tuoi annunci di lavoro.',
    noViews: 'Nessuna visita registrata.',
    viewedYour: 'ha visualizzato il tuo',
    job: 'annuncio di lavoro',
    ad: 'profilo',
    viewed: '',
    lockedTitle: 'Funzione Premium',
    lockedDesc: 'Sblocca Premium per vedere chi ha visitato i tuoi annunci.',
    lockedCount: (n: number) => `${n} visitatori totali`,
    upgrade: 'Sblocca Premium',
    contact: 'Contatta',
  },
  sq: {
    back: 'Kthehu në panel',
    title: 'Vizitat e profilit',
    subtitle: 'Shiko kush ka parë njoftimet e tua të punës.',
    noViews: 'Asnjë vizitë e regjistruar.',
    viewedYour: 'ka parë',
    job: 'njoftimin e punës',
    ad: 'profilin',
    viewed: 'tuaj',
    lockedTitle: 'Funksion Premium',
    lockedDesc: 'Aktivizo Premium për të parë kush ka vizituar njoftimet e tua.',
    lockedCount: (n: number) => `${n} vizitorë gjithsej`,
    upgrade: 'Aktivizo Premium',
    contact: 'Kontakto',
  },
} as const;

export default function EmployerProfileViewsPage() {
  const locale = useLocale();
  const t = loc[locale as keyof typeof loc] ?? loc.de;

  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [count, setCount] = useState(0);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; count: number; viewers: Viewer[]; locked: boolean }>('/api/profile-views', token)
      .then((res) => {
        if (res.ok) {
          setCount(res.count);
          setViewers(res.viewers || []);
          setLocked(res.locked);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Link href="/dashboard/employer" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#162C66] mb-6 transition-colors">
        <ArrowLeft size={16} />
        {t.back}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
          <Eye size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-[#0B1F44] tracking-tight">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#162C66] rounded-full animate-spin mx-auto" />
        </div>
      ) : locked ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-[#0B1F44] mb-2">{t.lockedTitle}</h2>
            <p className="text-sm text-slate-500 mb-2">{t.lockedDesc}</p>
            {count > 0 && (
              <p className="text-sm font-semibold text-[#162C66] mb-6">{t.lockedCount(count)}</p>
            )}
            <div className="space-y-3 mb-6 max-w-md mx-auto">
              {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 blur-[6px] select-none pointer-events-none">
                  <div className="w-9 h-9 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-24 mb-1" />
                    <div className="h-2.5 bg-slate-100 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/employer/premium"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#F5C400] to-[#FFD740] text-[#162C66] font-bold text-sm rounded-xl shadow-lg shadow-[#F5C400]/20 hover:shadow-xl hover:scale-[1.01] transition-all"
            >
              <Crown size={16} />
              {t.upgrade}
            </Link>
          </div>
        </div>
      ) : viewers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center">
          <Eye size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{t.noViews}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B1F44]">{t.title}</h2>
            <span className="text-xs font-semibold text-slate-400">{count} total</span>
          </div>
          <div className="divide-y divide-slate-50">
            {viewers.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="w-9 h-9 bg-[#162C66] rounded-full flex items-center justify-center text-white shrink-0">
                  {v.viewerImage ? (
                    <img src={v.viewerImage} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={15} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0B1F44] truncate">{v.viewerName}</p>
                  <p className="text-[12px] text-slate-400">
                    {t.viewedYour} {v.targetType === 'job' ? t.job : t.ad} {t.viewed}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/dashboard/employer/messages?to=${v.viewerId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-[#162C66] rounded-lg hover:bg-[#0F1E45] transition-colors"
                  >
                    <MessageSquare size={13} />
                    {t.contact}
                  </Link>
                  <span className="text-[11px] text-slate-400">
                    {new Date(v.createdAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
