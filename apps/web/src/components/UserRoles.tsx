'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { CheckCircle2, Search, Send, Key } from 'lucide-react';

export default function UserRoles() {
  const t = useTranslations('UserRoles');

  const employerFeatures = [
    { icon: <Search size={18} />, text: 'Post jobs' },
    { icon: <Send size={18} />, text: 'Receive applications' },
    { icon: <Key size={18} />, text: 'Read messages with Premium' },
  ];

  const jobSeekerFeatures = [
    { icon: <UserPlus size={18} />, text: 'Create profile' },
    { icon: <Send size={18} />, text: 'Apply for jobs' },
    { icon: <Key size={18} />, text: 'Read messages with Premium' },
  ];

  // Note: I'll hardcode the list items for now as they are specific to the role cards
  // but use the translatable titles and descriptions.

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Employer Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 lg:p-12 hover:border-blue-600/20 transition-all duration-500 shadow-sm hover:shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
            </div>
            
            <h3 className="text-3xl font-bold text-slate-900 mb-6">{t('employerTitle')}</h3>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              {t('employerDesc')}
            </p>
            
            <ul className="space-y-4 mb-10">
              {[t('employerFeature1'), t('employerFeature2'), t('employerFeature3')].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-slate-700 font-medium">
                  <CheckCircle2 className="text-blue-600" size={22} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <button className="w-full lg:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
              {t('employerCTA')}
            </button>
          </motion.div>

          {/* Job Seeker Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 transition-all duration-500 shadow-xl"
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
            </div>
            
            <h3 className="text-3xl font-bold text-white mb-6">{t('jobSeekerTitle')}</h3>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              {t('jobSeekerDesc')}
            </p>
            
            <ul className="space-y-4 mb-10">
              {[t('jobSeekerFeature1'), t('jobSeekerFeature2'), t('jobSeekerFeature3')].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-slate-200 font-medium">
                  <CheckCircle2 className="text-blue-50" size={22} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <button className="w-full lg:w-auto bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all shadow-lg">
              {t('jobSeekerCTA')}
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Simple internal helper for icon
function UserPlus({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
