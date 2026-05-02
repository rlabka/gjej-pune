'use client';

import SectionHeader from '@/components/shared/SectionHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Calendar,
  MapPin,
  MoreVertical,
  ChevronRight,
  MessageSquare,
  Briefcase,
  FileX2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import FeatureDisabled from '@/app/[locale]/dashboard/job-seeker/_components/FeatureDisabled';
import { getJobSeekerConfig } from '@/lib/siteConfig';

export const dynamic = 'force-dynamic';

type ApplicationStatus = 'In Review' | 'Interview' | 'Rejected' | 'Pending';

type Application = {
  id: number;
  title: string;
  company: string;
  location: string;
  appliedDate: string;
  status: ApplicationStatus;
  logo: string;
};

const applications: Application[] = [
  {
    id: 1,
    title: 'Senior UX Designer',
    company: 'Google Switzerland',
    location: 'Zürich',
    appliedDate: '2 days ago',
    status: 'Interview',
    logo: 'G'
  },
  {
    id: 2,
    title: 'Frontend Developer',
    company: 'Meta',
    location: 'Remote',
    appliedDate: '5 days ago',
    status: 'In Review',
    logo: 'M'
  },
  {
    id: 3,
    title: 'Product Manager',
    company: 'Netflix',
    location: 'Bern',
    appliedDate: '1 week ago',
    status: 'Pending',
    logo: 'N'
  },
  {
    id: 4,
    title: 'Backend Engineer',
    company: 'Amazon',
    location: 'Geneva',
    appliedDate: '2 weeks ago',
    status: 'Rejected',
    logo: 'A'
  },
  {
    id: 5,
    title: 'Mobile App Developer',
    company: 'Spotify',
    location: 'Zürich',
    appliedDate: '3 weeks ago',
    status: 'In Review',
    logo: 'S'
  }
];

// Removed StatusPill - using StatusBadge component for consistency

export default function ApplicationsPage() {
  const t = useTranslations('Applications');
  const emptyT = useTranslations('jobSeeker.empty');
  const feedbackT = useTranslations('jobSeeker.feedback');
  const [activeTab, setActiveTab] = useState<'All' | 'In Review' | 'Interview' | 'Rejected'>('All');
  const [toast, setToast] = useState<string | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null);

  if (!getJobSeekerConfig().features.showApplications) {
    return <FeatureDisabled />;
  }

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const tabs: Array<{
    name: 'All' | 'In Review' | 'Interview' | 'Rejected';
    label: string;
  }> = [
    { name: 'All', label: t('tabs.all') },
    { name: 'In Review', label: t('tabs.inReview') },
    { name: 'Interview', label: t('tabs.interview') },
    { name: 'Rejected', label: t('tabs.rejected') }
  ];

  const statusTranslationKeys: Record<ApplicationStatus, string> = {
    'In Review': 'inReview',
    Interview: 'interview',
    Rejected: 'rejected',
    Pending: 'pending'
  };

  const filteredApplications = activeTab === 'All' ? applications : applications.filter((a) => a.status === activeTab);

  const tabCount = (tab: (typeof tabs)[number]['name']) => {
    if (tab === 'All') return applications.length;
    return applications.filter((a) => a.status === tab).length;
  };

  return (
    <>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={clsx(
                'px-3.5 sm:px-4 py-2 text-[13px] sm:text-sm font-semibold rounded-full transition-all duration-200',
                isActive
                  ? 'bg-[#162C66] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              )}
            >
              {tab.label}
              <span
                className={clsx(
                  'ml-1.5 text-[10px] sm:text-[11px] tabular-nums',
                  isActive ? 'text-white/70' : 'text-slate-400'
                )}
              >
                {tabCount(tab.name)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications list */}
      {filteredApplications.length === 0 ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            title={emptyT('applications.title')}
            description={emptyT('applications.description')}
            icon={<FileX2 size={48} />}
            action={
              <Link href="/dashboard/job-seeker/jobs">
                <Button variant="primary">
                  <Briefcase size={18} />
                  <span>{emptyT('cta.browseJobs')}</span>
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="p-0 overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: main info */}
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100 text-[#162C66] rounded-xl flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
                      {app.logo}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-semibold text-[#0B1F44] leading-tight mb-0.5 truncate">{app.title}</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-500 mb-1.5">{app.company}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                          <MapPin size={13} />
                          <span>{app.location}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                          <Calendar size={13} />
                          <span>{t('appliedOn', { date: app.appliedDate })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center shrink-0">
                    <StatusBadge status={statusTranslationKeys[app.status]} />
                    <button
                      className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
                      disabled={loadingActionId === app.id}
                      onClick={() => {
                        if (loadingActionId === app.id) return;
                        setLoadingActionId(app.id);
                        window.setTimeout(() => {
                          setToast(feedbackT('toast.actionNotAvailable'));
                          setLoadingActionId(null);
                        }, 550);
                      }}
                      title={feedbackT('toast.actionNotAvailable')}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

