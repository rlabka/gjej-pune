'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getCompany } from '@/data/mockAdminCompanies';
import { getEmployersByCompany } from '@/data/mockAdminEmployers';
import { ArrowLeft, Building2, Users, Briefcase, FileText } from 'lucide-react';
import { clsx } from 'clsx';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

type TabId = 'overview' | 'employers' | 'jobs' | 'moderation';

const MOCK_LOG = [
  { action: 'Company verified', date: '2025-01-15T10:00:00Z' },
  { action: 'Job "Senior Engineer" approved', date: '2025-01-10T14:00:00Z' },
  { action: 'Profile review completed', date: '2025-01-05T09:00:00Z' }
];

export default function AdminCompanyDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const t = useTranslations('Admin.companyDetailPage');
  const tCommon = useTranslations('Admin');
  const tEmployers = useTranslations('Admin.employersPage');

  const company = useMemo(() => (id ? getCompany(id) : null), [id]);
  const employers = useMemo(() => (id ? getEmployersByCompany(id) : []), [id]);
  const [tab, setTab] = useState<TabId>('overview');

  if (!id || !company) {
    return (
      <div className="space-y-6">
        <p className="text-slate-600">{t('companyNotFound')}</p>
        <Link href="/admin/companies" className="text-sm font-bold text-[#162C66] hover:underline">
          {t('backToCompanies')}
        </Link>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'overview', label: t('overview'), icon: Building2 },
    { id: 'employers', label: t('employers'), icon: Users },
    { id: 'jobs', label: t('jobs'), icon: Briefcase },
    { id: 'moderation', label: t('moderationLog'), icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/companies" className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label={t('backToCompanies')}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#162C66]">{company.name}</h1>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-1" aria-label="Tabs">
          {tabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-t-xl border-b-2 transition-colors',
                tab === tabId
                  ? 'border-slate-800 text-slate-900 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
              )}
              aria-current={tab === tabId ? 'page' : undefined}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'overview' && (
        <Card>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('industry')}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{company.industry}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('location')}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{company.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('verified')}</dt>
              <dd className="mt-1">
                {company.verified ? <Badge variant="success">{t('verified')}</Badge> : <Badge variant="default">{t('notVerified')}</Badge>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('jobsCount')}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{company.jobsCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('employersCount')}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{company.employersCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('createdAt')}</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">{formatDate(company.createdAt)}</dd>
            </div>
          </dl>
        </Card>
      )}

      {tab === 'employers' && (
        <Card className="p-0 overflow-hidden">
          {employers.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">{t('noEmployers')}</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('name')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('email')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('roleColumn')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{tCommon('statusColumn')}</th>
                </tr>
              </thead>
              <tbody>
                {employers.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="px-6 py-3 text-sm font-medium text-slate-800">{e.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{e.email}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{e.role === 'owner' ? tEmployers('roleOwner') : tEmployers('roleRecruiter')}</td>
                    <td className="px-6 py-3">
                      <Badge variant={e.status === 'active' ? 'success' : e.status === 'suspended' ? 'warning' : 'error'}>
                        {e.status === 'active' ? tEmployers('statusActive') : e.status === 'suspended' ? tEmployers('statusSuspended') : tEmployers('statusBanned')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'jobs' && (
        <Card>
          <p className="text-sm text-slate-500">{t('noJobs')}</p>
        </Card>
      )}

      {tab === 'moderation' && (
        <Card>
          <p className="text-sm text-slate-500 mb-4">{t('logPlaceholder')}</p>
          <ul className="space-y-2">
            {MOCK_LOG.map((entry, i) => (
              <li key={i} className="text-sm text-slate-700 flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                <span>{entry.action}</span>
                <span className="text-slate-500">{formatDate(entry.date)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
