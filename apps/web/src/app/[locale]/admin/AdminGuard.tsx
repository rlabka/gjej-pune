'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getSession } from '@/lib/auth';

type Props = { children: React.ReactNode };

export default function AdminGuard({ children }: Props) {
  const t = useTranslations('auth.guard');
  const locale = useLocale();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Ensure we read session on client after hydration (localStorage available)
    const session = getSession();
    if (!session?.isAuthenticated || session.role !== 'admin') {
      window.location.href = `/${locale}/auth/login`;
      return;
    }
    setReady(true);
  }, [locale]);

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-[#162C66] font-black text-lg">{t('checking')}</div>
          <div className="mt-2 text-sm font-medium text-slate-500">{t('hint')}</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
