'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { LayoutDashboard } from 'lucide-react';

export default function FeatureDisabled() {
  const t = useTranslations('Dashboard.jobSeekerNav');

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <p className="text-lg font-bold text-amber-900">
        This section is currently disabled by the platform administrator.
      </p>
      <p className="mt-2 text-sm text-amber-800">
        You can still use other parts of your dashboard.
      </p>
      <Link
        href="/dashboard/job-seeker"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#162C66] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1f3c8a] transition-colors"
      >
        <LayoutDashboard size={18} />
        {t('overview')}
      </Link>
    </div>
  );
}
