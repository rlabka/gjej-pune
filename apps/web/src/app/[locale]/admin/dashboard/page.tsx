'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  getDashboardKpis,
  getRecentJobSeekers,
  getRecentEmployers,
  getRecentCompanies,
  getSuspendedJobSeekers,
  getSuspendedEmployers,
  getUnverifiedCompanies,
} from '@/data/adminDashboardData';
import {
  Users,
  Briefcase,
  Building2,
  FileText,
  UserX,
  Clock,
} from 'lucide-react';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wide truncate">{label}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-black text-[#162C66] tabular-nums">{value.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-[#162C66]/10 p-2 sm:p-3 text-[#162C66] shrink-0">
          <Icon size={20} className="sm:hidden" />
          <Icon size={24} className="hidden sm:block" />
        </div>
      </div>
    </Card>
  );
}

function SectionCard({
  title,
  viewAllHref,
  viewAllLabel,
  children,
  emptyMessage,
  empty,
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  children: React.ReactNode;
  emptyMessage: string;
  empty: boolean;
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-[#162C66]">{title}</h2>
        <Link href={viewAllHref} className="text-sm font-medium text-slate-500 hover:text-slate-700">
          {viewAllLabel}
        </Link>
      </div>
      <div className="min-h-[120px]">
        {empty ? (
          <p className="px-6 py-8 text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-slate-50">{children}</ul>
        )}
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations('Admin.dashboardPage');
  const kpis = getDashboardKpis();
  const recentJobSeekers = getRecentJobSeekers(5);
  const recentEmployers = getRecentEmployers(5);
  const recentCompanies = getRecentCompanies(5);
  const suspendedJobSeekers = getSuspendedJobSeekers();
  const suspendedEmployers = getSuspendedEmployers();
  const unverifiedCompanies = getUnverifiedCompanies();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#162C66]">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-4">
        <KpiCard label={t('kpiTotalJobSeekers')} value={kpis.totalJobSeekers} icon={Users} />
        <KpiCard label={t('kpiTotalEmployers')} value={kpis.totalEmployers} icon={Briefcase} />
        <KpiCard label={t('kpiTotalCompanies')} value={kpis.totalCompanies} icon={Building2} />
        <KpiCard label={t('kpiActiveJobs')} value={kpis.activeJobs} icon={FileText} />
        <KpiCard label={t('kpiSuspendedAccounts')} value={kpis.suspendedAccounts} icon={UserX} />
        <KpiCard label={t('kpiPendingVerifications')} value={kpis.pendingVerifications} icon={Clock} />
      </div>

      {/* Admin shortcuts */}
      <div>
        <h2 className="text-lg font-bold text-[#162C66] mb-3">{t('shortcuts')}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/job-seekers">
            <Button variant="secondary" size="md" className="inline-flex gap-2">
              <Users size={18} />
              {t('manageJobSeekers')}
            </Button>
          </Link>
          <Link href="/admin/employers">
            <Button variant="secondary" size="md" className="inline-flex gap-2">
              <Briefcase size={18} />
              {t('manageEmployers')}
            </Button>
          </Link>
          <Link href="/admin/companies">
            <Button variant="secondary" size="md" className="inline-flex gap-2">
              <Building2 size={18} />
              {t('manageCompanies')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-bold text-[#162C66] mb-4">{t('recentActivity')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SectionCard
            title={t('recentJobSeekers')}
            viewAllHref="/admin/job-seekers"
            viewAllLabel={t('viewAll')}
            emptyMessage={t('emptyRecentJobSeekers')}
            empty={recentJobSeekers.length === 0}
          >
            {recentJobSeekers.map((s) => (
              <li key={s.id} className="px-6 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 truncate">{s.email}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(s.createdAt)}</span>
              </li>
            ))}
          </SectionCard>
          <SectionCard
            title={t('recentEmployers')}
            viewAllHref="/admin/employers"
            viewAllLabel={t('viewAll')}
            emptyMessage={t('emptyRecentEmployers')}
            empty={recentEmployers.length === 0}
          >
            {recentEmployers.map((e) => (
              <li key={e.id} className="px-6 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{e.name}</p>
                  <p className="text-xs text-slate-500 truncate">{e.companyName}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(e.createdAt)}</span>
              </li>
            ))}
          </SectionCard>
          <SectionCard
            title={t('recentCompanies')}
            viewAllHref="/admin/companies"
            viewAllLabel={t('viewAll')}
            emptyMessage={t('emptyRecentCompanies')}
            empty={recentCompanies.length === 0}
          >
            {recentCompanies.map((c) => (
              <li key={c.id} className="px-6 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 truncate">{c.industry} · {c.location}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(c.createdAt)}</span>
              </li>
            ))}
          </SectionCard>
        </div>
      </div>

      {/* Attention required */}
      <div>
        <h2 className="text-lg font-bold text-[#162C66] mb-4">{t('attentionRequired')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <SectionCard
            title={t('suspendedJobSeekers')}
            viewAllHref="/admin/job-seekers"
            viewAllLabel={t('viewAll')}
            emptyMessage={t('emptySuspendedJobSeekers')}
            empty={suspendedJobSeekers.length === 0}
          >
            {suspendedJobSeekers.map((s) => (
              <li key={s.id} className="px-6 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                  <p className="text-xs text-slate-500 truncate">{s.email}</p>
                </div>
                <span className="text-xs text-amber-600 font-medium shrink-0">{s.status}</span>
              </li>
            ))}
          </SectionCard>
          <SectionCard
            title={t('suspendedEmployers')}
            viewAllHref="/admin/employers"
            viewAllLabel={t('viewAll')}
            emptyMessage={t('emptySuspendedEmployers')}
            empty={suspendedEmployers.length === 0}
          >
            {suspendedEmployers.map((e) => (
              <li key={e.id} className="px-6 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{e.name}</p>
                  <p className="text-xs text-slate-500 truncate">{e.companyName}</p>
                </div>
                <span className="text-xs text-amber-600 font-medium shrink-0">{e.status}</span>
              </li>
            ))}
          </SectionCard>
          <SectionCard
            title={t('unverifiedCompanies')}
            viewAllHref="/admin/companies"
            viewAllLabel={t('viewAll')}
            emptyMessage={t('emptyUnverifiedCompanies')}
            empty={unverifiedCompanies.length === 0}
          >
            {unverifiedCompanies.map((c) => (
              <li key={c.id} className="px-6 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                  <p className="text-xs text-slate-500 truncate">{c.industry} · {c.location}</p>
                </div>
                <span className="text-xs text-amber-600 font-medium shrink-0">{t('labelUnverified')}</span>
              </li>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
