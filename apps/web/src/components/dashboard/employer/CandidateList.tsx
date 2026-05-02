'use client';

import { useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/shared/StatusBadge';
import { Link } from '@/i18n/routing';
import {
  User,
  Search,
  MessageSquare,
  Users,
  Briefcase,
  Calendar,
  ArrowRight,
  FileText
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import MetricCard from '@/components/shared/MetricCard';

type CandidateStatus = 'In Review' | 'Pending' | 'Hired' | 'Rejected';
type JobTitleKey = 'seniorFrontendEngineer' | 'productDesigner' | 'fullstackDeveloper' | 'marketingManager' | 'salesExecutive';
type RoleKey = 'frontendEngineer' | 'uiDesigner' | 'backendDeveloper' | 'productManager';

const candidates: Array<{
  id: number;
  name: string;
  image: string;
  roleKey: RoleKey;
  years: number;
  status: CandidateStatus;
  jobTitleKey: JobTitleKey;
  appliedAt: string;
  location: string;
}> = [
  { id: 1, name: 'Alex Johnson', image: 'https://i.pravatar.cc/150?img=2', roleKey: 'frontendEngineer', years: 5, status: 'In Review', jobTitleKey: 'seniorFrontendEngineer', appliedAt: 'Jan 28, 2026', location: 'Berlin, Germany' },
  { id: 2, name: 'Sarah Miller', image: 'https://i.pravatar.cc/150?img=1', roleKey: 'uiDesigner', years: 3, status: 'Pending', jobTitleKey: 'productDesigner', appliedAt: 'Jan 27, 2026', location: 'Zurich, Switzerland' },
  { id: 3, name: 'Marc Dubois', image: 'https://i.pravatar.cc/150?img=3', roleKey: 'backendDeveloper', years: 8, status: 'Hired', jobTitleKey: 'fullstackDeveloper', appliedAt: 'Jan 20, 2026', location: 'Paris, France' },
  { id: 4, name: 'Elena Rossi', image: 'https://i.pravatar.cc/150?img=4', roleKey: 'productManager', years: 4, status: 'Rejected', jobTitleKey: 'marketingManager', appliedAt: 'Jan 15, 2026', location: 'Milan, Italy' },
  { id: 5, name: 'James Wilson', image: 'https://i.pravatar.cc/150?img=5', roleKey: 'frontendEngineer', years: 6, status: 'In Review', jobTitleKey: 'seniorFrontendEngineer', appliedAt: 'Jan 29, 2026', location: 'London, UK' },
  { id: 6, name: 'Anna Schmidt', image: 'https://i.pravatar.cc/150?img=6', roleKey: 'uiDesigner', years: 2, status: 'Pending', jobTitleKey: 'productDesigner', appliedAt: 'Jan 26, 2026', location: 'Munich, Germany' },
  { id: 7, name: 'Lucas Martin', image: 'https://i.pravatar.cc/150?img=7', roleKey: 'backendDeveloper', years: 7, status: 'Hired', jobTitleKey: 'fullstackDeveloper', appliedAt: 'Jan 18, 2026', location: 'Lyon, France' },
  { id: 8, name: 'Sofia Garcia', image: 'https://i.pravatar.cc/150?img=8', roleKey: 'productManager', years: 5, status: 'In Review', jobTitleKey: 'salesExecutive', appliedAt: 'Jan 25, 2026', location: 'Madrid, Spain' },
];

const JOB_OPTIONS: { value: '' | JobTitleKey; labelKey: string }[] = [
  { value: '', labelKey: 'all' },
  { value: 'seniorFrontendEngineer', labelKey: 'seniorFrontendEngineer' },
  { value: 'productDesigner', labelKey: 'productDesigner' },
  { value: 'fullstackDeveloper', labelKey: 'fullstackDeveloper' },
  { value: 'marketingManager', labelKey: 'marketingManager' },
  { value: 'salesExecutive', labelKey: 'salesExecutive' },
];

const STATUS_OPTIONS: { value: '' | CandidateStatus; labelKey: string }[] = [
  { value: '', labelKey: 'all' },
  { value: 'In Review', labelKey: 'inReview' },
  { value: 'Pending', labelKey: 'pending' },
  { value: 'Hired', labelKey: 'hired' },
  { value: 'Rejected', labelKey: 'rejected' },
];

type SortKey = 'name' | 'date' | 'status';
type TimeFilterKey = 'all' | '7d' | '30d';

const selectCls = 'px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-[#0B1F44] focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400] outline-none transition-all';

export default function CandidateList() {
  const t = useTranslations('EmployerCandidates');
  const dashboardT = useTranslations('EmployerDashboard');
  const roleT = useTranslations('EmployerDashboard.candidateRoles');
  const jobTitlesT = useTranslations('EmployerDashboard.jobTitles');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | CandidateStatus>('');
  const [jobFilter, setJobFilter] = useState<'' | JobTitleKey>('');
  const [timeFilter, setTimeFilter] = useState<TimeFilterKey>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');

  const filteredAndSorted = useMemo(() => {
    let list = [...candidates];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          jobTitlesT(c.jobTitleKey).toLowerCase().includes(q) ||
          roleT(c.roleKey).toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (jobFilter) list = list.filter((c) => c.jobTitleKey === jobFilter);

    if (timeFilter !== 'all') {
      const refDate = new Date('2026-02-01');
      const cutoff = new Date(refDate);
      cutoff.setDate(cutoff.getDate() - (timeFilter === '7d' ? 7 : 30));
      list = list.filter((c) => {
        const applied = new Date(c.appliedAt);
        return !isNaN(applied.getTime()) && applied >= cutoff;
      });
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'status') {
      const order: CandidateStatus[] = ['In Review', 'Pending', 'Hired', 'Rejected'];
      list.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
    } else {
      list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    }

    return list;
  }, [searchQuery, statusFilter, jobFilter, timeFilter, sortBy, jobTitlesT, roleT]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const inReview = candidates.filter((c) => c.status === 'In Review').length;
    const pending = candidates.filter((c) => c.status === 'Pending').length;
    const hired = candidates.filter((c) => c.status === 'Hired').length;
    const rejected = candidates.filter((c) => c.status === 'Rejected').length;
    return { total, inReview, pending, hired, rejected };
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label={t('totalCandidates')} value={stats.total} icon={<Users size={22} />} iconColor="navy" />
        <MetricCard label="In Review" value={stats.inReview} icon={<FileText size={22} />} iconColor="amber" />
        <MetricCard label="Pending" value={stats.pending} icon={<FileText size={22} />} iconColor="blue" />
        <MetricCard label="Hired" value={stats.hired} icon={<User size={22} />} iconColor="emerald" />
        <MetricCard label="Rejected" value={stats.rejected} icon={<FileText size={22} />} iconColor="rose" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-[#0B1F44] placeholder:text-slate-400 focus:ring-2 focus:ring-[#F5C400]/30 focus:border-[#F5C400] outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter((e.target.value || '') as '' | CandidateStatus)} className={selectCls} aria-label={t('filterByStatus')}>
            <option value="">{t('filterByStatus')}</option>
            {STATUS_OPTIONS.filter((o) => o.value).map((o) => (<option key={o.value} value={o.value}>{o.value}</option>))}
          </select>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as TimeFilterKey)} className={selectCls} aria-label={t('filterByTime')}>
            <option value="all">{t('filterByTime')}</option>
            <option value="7d">{t('time7d')}</option>
            <option value="30d">{t('time30d')}</option>
          </select>
          <select value={jobFilter} onChange={(e) => setJobFilter((e.target.value || '') as '' | JobTitleKey)} className={selectCls} aria-label={t('filterByJob')}>
            <option value="">{t('filterByJob')}</option>
            {JOB_OPTIONS.filter((o) => o.value).map((o) => (<option key={o.value} value={o.value}>{jobTitlesT(o.value)}</option>))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className={selectCls}>
            <option value="date">{t('sortDate')}</option>
            <option value="name">{t('sortName')}</option>
            <option value="status">{t('sortStatus')}</option>
          </select>
        </div>
      </div>

      {/* Candidate list */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0B1F44]">{t('recentCandidates')}</h3>
          <Link href="/dashboard/employer/applications" className="text-sm font-medium text-slate-400 hover:text-[#0B1F44] transition-colors flex items-center gap-1">
            {t('viewAllInApplications')}
            <ArrowRight size={14} />
          </Link>
        </div>

        {filteredAndSorted.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <User size={32} className="text-slate-300" />
            </div>
            <p className="font-semibold text-[#0B1F44] mb-1">{t('noResults')}</p>
            <p className="text-sm text-slate-500">{t('noResultsHint')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredAndSorted.map((candidate) => (
              <div
                key={candidate.id}
                className="group px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <img
                    src={candidate.image}
                    alt={candidate.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B1F44] text-sm mb-0.5">{candidate.name}</p>
                    <p className="text-[12px] text-slate-500 font-medium mb-1">
                      {roleT(candidate.roleKey as RoleKey)} · {dashboardT('experienceYears', { count: candidate.years })}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Briefcase size={11} />
                        {t('appliedFor', { job: jobTitlesT(candidate.jobTitleKey) })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {t('appliedOn', { date: candidate.appliedAt })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={candidate.status} />
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="text-[13px] px-3 py-1.5">
                      {t('viewProfile')}
                    </Button>
                    <Button variant="outline" size="sm" className="text-[13px] px-3 py-1.5">
                      <MessageSquare size={14} />
                      {t('message')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
