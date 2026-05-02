'use client';

import Button from '@/components/ui/Button';
import { Link } from '@/i18n/routing';
import { UserCheck, CheckCircle2, Circle } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

const loc = {
  de: {
    completeProfile: 'Profil vervollständigen', improveChances: 'Verbessere deine Einstellungschancen',
    progress: 'Fortschritt', editProfile: 'Profil bearbeiten',
    checkName: 'Name hinzufügen', checkEmail: 'E-Mail bestätigen',
    checkPhone: 'Telefonnummer', checkLocation: 'Standort angeben',
    checkPhoto: 'Profilbild hochladen',
  },
  en: {
    completeProfile: 'Complete your profile', improveChances: 'Improve your hiring chances',
    progress: 'Progress', editProfile: 'Edit Profile',
    checkName: 'Add name', checkEmail: 'Confirm email',
    checkPhone: 'Phone number', checkLocation: 'Add location',
    checkPhoto: 'Upload profile photo',
  },
  fr: {
    completeProfile: 'Complétez votre profil', improveChances: 'Améliorez vos chances',
    progress: 'Progrès', editProfile: 'Modifier le profil',
    checkName: 'Ajouter un nom', checkEmail: 'Confirmer l\'e-mail',
    checkPhone: 'Numéro de téléphone', checkLocation: 'Indiquer le lieu',
    checkPhoto: 'Télécharger une photo',
  },
  it: {
    completeProfile: 'Completa il tuo profilo', improveChances: 'Migliora le tue possibilità',
    progress: 'Progresso', editProfile: 'Modifica profilo',
    checkName: 'Aggiungi nome', checkEmail: 'Conferma e-mail',
    checkPhone: 'Numero di telefono', checkLocation: 'Indica la posizione',
    checkPhoto: 'Carica foto profilo',
  },
  sq: {
    completeProfile: 'Plotëso profilin tënd', improveChances: 'Përmirëso shanset e punësimit',
    progress: 'Progresi', editProfile: 'Ndrysho profilin',
    checkName: 'Shto emrin', checkEmail: 'Konfirmo email-in',
    checkPhone: 'Numri i telefonit', checkLocation: 'Shto vendndodhjen',
    checkPhoto: 'Ngarko foton e profilit',
  },
} as const;

interface ProfileData {
  displayName: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  image: string | null;
}

export default function ProfileCompletion() {
  const locale = useLocale() as keyof typeof loc;
  const l = loc[locale] ?? loc.de;

  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState([
    { done: false, label: l.checkName },
    { done: false, label: l.checkEmail },
    { done: false, label: l.checkPhone },
    { done: false, label: l.checkLocation },
    { done: false, label: l.checkPhoto },
  ]);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    api.get<{ ok: boolean; profile: ProfileData }>('/api/settings/profile', token)
      .then((res) => {
        if (res.ok && res.profile) {
          const p = res.profile;
          setSteps([
            { done: !!p.displayName, label: l.checkName },
            { done: !!p.email, label: l.checkEmail },
            { done: !!p.phone, label: l.checkPhone },
            { done: !!p.location, label: l.checkLocation },
            { done: !!p.image, label: l.checkPhoto },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [l]);

  const doneCount = steps.filter(s => s.done).length;
  const percentage = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
          <UserCheck size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-[#0B1F44] text-sm sm:text-[15px] leading-tight">{l.completeProfile}</h4>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">{l.improveChances}</p>
        </div>
      </div>

      {loading ? (
        <LoadingScreen variant="inline" hideText />
      ) : (
        <>
          {/* Circular-style progress */}
          <div className="flex items-center gap-4 mb-5 p-3 bg-slate-50/80 rounded-xl">
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24"
                  fill="none"
                  stroke="#162C66"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - percentage / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-[#162C66]">
                {percentage}%
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{l.progress}</p>
              <p className="text-sm font-bold text-[#0B1F44] mt-0.5">{doneCount}/{steps.length}</p>
            </div>
          </div>

          {/* Steps checklist */}
          <div className="space-y-2 mb-5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {step.done ? (
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <Circle size={16} className="text-slate-300 shrink-0" />
                )}
                <span className={`text-[13px] font-medium ${step.done ? 'text-slate-400 line-through' : 'text-[#0B1F44]'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      
      <Link href="/dashboard/job-seeker/profile" className="block">
        <Button 
          variant="secondary" 
          className="w-full text-xs sm:text-sm font-bold py-2.5 bg-[#162C66] text-white hover:bg-[#0F1E45] shadow-sm rounded-xl transition-all"
        >
          {l.editProfile}
        </Button>
      </Link>
    </div>
  );
}
