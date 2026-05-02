'use client';

import SectionHeader from '@/components/shared/SectionHeader';
import MetricCard from '@/components/shared/MetricCard';
import RecommendedJobs from './RecommendedJobs';
import ApplicationsList from './ApplicationsList';
import ProfileCompletion from './ProfileCompletion';
import { Briefcase, FileText, Star, MessageSquare } from 'lucide-react';

export default function JobSeekerOverview() {
  return (
    <div>
      <SectionHeader 
        title="Job Seeker Dashboard" 
        subtitle="Welcome back, Sarah. We found 12 new jobs matching your profile."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard label="Applications" value={8} icon={<FileText size={24} />} />
        <MetricCard label="Interviews" value={2} icon={<MessageSquare size={24} />} />
        <MetricCard label="Saved Jobs" value={15} icon={<Star size={24} />} />
        <MetricCard label="Profile Views" value={248} icon={<Briefcase size={24} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-[#162C66] mb-6">Recommended for you</h3>
            <RecommendedJobs />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#162C66] mb-6">Recent Applications</h3>
            <ApplicationsList />
          </div>
        </div>
        <div className="space-y-8">
          <ProfileCompletion />
          <div className="bg-[#F5C400] p-8 rounded-[2rem] shadow-lg shadow-[#F5C400]/20 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-[#162C66] font-semibold text-xl mb-2">Go Premium</h4>
              <p className="text-[#162C66]/70 text-sm font-bold leading-relaxed mb-6">See who viewed your profile and rank higher in job searches.</p>
              <button className="bg-[#162C66] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#1f3c8a] transition-all">Unlock Now</button>
            </div>
            <Star className="absolute -bottom-4 -right-4 w-24 h-24 text-[#162C66]/5 rotate-12 transition-transform group-hover:scale-125" />
          </div>
        </div>
      </div>
    </div>
  );
}
