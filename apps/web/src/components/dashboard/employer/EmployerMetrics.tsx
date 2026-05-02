import { Briefcase, FileText, MessageSquare, Star } from 'lucide-react';
import MetricCard from '@/components/shared/MetricCard';
import { useTranslations } from 'next-intl';

export default function EmployerMetrics() {
  const t = useTranslations('EmployerDashboard.metrics');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard 
        label={t('activeJobs')}
        value={12} 
        icon={<Briefcase size={22} />} 
        trend={{ value: '+2', isPositive: true }}
        iconColor="blue"
      />
      <MetricCard 
        label={t('newApplications')}
        value={148} 
        icon={<FileText size={22} />} 
        trend={{ value: '+15%', isPositive: true }}
        iconColor="violet"
      />
      <MetricCard 
        label={t('shortlisted')}
        value={24} 
        icon={<Star size={22} />} 
        trend={{ value: '+8', isPositive: true }}
        iconColor="amber"
      />
      <MetricCard 
        label={t('newMessages')}
        value={5} 
        icon={<MessageSquare size={22} />} 
        trend={{ value: t('trendNew'), isPositive: true }}
        iconColor="emerald"
      />
    </div>
  );
}
