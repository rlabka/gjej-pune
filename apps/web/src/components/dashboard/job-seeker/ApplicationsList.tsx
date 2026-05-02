'use client';

import StatusBadge from '@/components/shared/StatusBadge';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';

const applications = [
  { id: 1, title: 'Senior React Dev', company: 'Google', date: '2 days ago', status: 'In Review', logo: 'G', color: 'bg-blue-600' },
  { id: 2, title: 'Junior UI Designer', company: 'Meta', date: '1 week ago', status: 'Pending', logo: 'M', color: 'bg-sky-500' },
  { id: 3, title: 'Product Manager', company: 'Netflix', date: '3 days ago', status: 'Hired', logo: 'N', color: 'bg-red-600' },
  { id: 4, title: 'Backend Architect', company: 'Amazon', date: '5 days ago', status: 'Rejected', logo: 'A', color: 'bg-amber-600' },
];

const statusMap: Record<string, string> = {
  'In Review': 'inReview',
  'Pending': 'pending',
  'Hired': 'hired',
  'Rejected': 'rejected'
};

export default function ApplicationsList() {
  const t = useTranslations('Dashboard.overview');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {applications.map((app, i) => (
        <div 
          key={app.id} 
          className={clsx(
            "flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-slate-50/60 transition-colors cursor-pointer group",
            i < applications.length - 1 && "border-b border-slate-100/80"
          )}
        >
          <div className={clsx(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm",
            app.color
          )}>
            {app.logo}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#0B1F44] text-[13px] sm:text-sm leading-tight truncate group-hover:text-[#162C66] transition-colors">
              {app.title}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate mt-0.5">
              {app.company} · {t('appliedOn', { date: app.date })}
            </p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={statusMap[app.status] || 'pending'} />
          </div>
        </div>
      ))}
    </div>
  );
}
