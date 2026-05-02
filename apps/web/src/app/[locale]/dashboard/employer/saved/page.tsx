'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';

export default function SavedCandidatesPage() {
  const t = useTranslations('EmployerDashboard');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-5">
        <Heart size={28} />
      </div>
      <h2 className="text-lg font-bold text-[#0B1F44] mb-2">{t('savedCandidatesEmpty')}</h2>
      <p className="text-sm text-slate-400 max-w-sm">{t('savedCandidatesEmptyDesc')}</p>
    </div>
  );
}
