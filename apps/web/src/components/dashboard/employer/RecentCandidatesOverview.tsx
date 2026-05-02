'use client';

import Card from '@/components/ui/Card';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

const recentCandidates = [
  { id: 1, name: 'Alex Johnson', image: 'https://i.pravatar.cc/150?img=2', roleKey: 'frontendEngineer', years: 5, status: 'In Review', jobTitleKey: 'seniorFrontendEngineer' },
  { id: 2, name: 'Sarah Miller', image: 'https://i.pravatar.cc/150?img=1', roleKey: 'uiDesigner', years: 3, status: 'Pending', jobTitleKey: 'productDesigner' },
  { id: 3, name: 'Marc Dubois', image: 'https://i.pravatar.cc/150?img=3', roleKey: 'backendDeveloper', years: 8, status: 'Hired', jobTitleKey: 'fullstackDeveloper' },
  { id: 4, name: 'Elena Rossi', image: 'https://i.pravatar.cc/150?img=4', roleKey: 'productManager', years: 4, status: 'Rejected', jobTitleKey: 'marketingManager' },
];

type RoleKey = 'frontendEngineer' | 'uiDesigner' | 'backendDeveloper' | 'productManager';

export default function RecentCandidatesOverview() {
  const t = useTranslations('EmployerDashboard');
  const roleT = useTranslations('EmployerDashboard.candidateRoles');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#0B1F44]">{t('recentCandidates')}</h3>
        <Link
          href="/dashboard/employer/applications"
          className="text-sm font-medium text-slate-400 hover:text-[#0B1F44] transition-colors flex items-center gap-1"
        >
          {t('viewAll')}
          <ArrowRight size={14} />
        </Link>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {recentCandidates.map((candidate) => (
            <Link
              key={candidate.id}
              href="/dashboard/employer/applications"
              className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors"
            >
              <img
                src={candidate.image}
                alt={candidate.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0B1F44] text-sm truncate">{candidate.name}</p>
                <p className="text-[12px] text-slate-400 font-medium truncate">
                  {roleT(candidate.roleKey as RoleKey)} · {t('experienceYears', { count: candidate.years })}
                </p>
              </div>
              {/* Status badge removed per wireframe */}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
