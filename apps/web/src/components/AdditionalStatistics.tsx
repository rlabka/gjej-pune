'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Users, Briefcase, Building2, Calendar } from 'lucide-react';

export default function AdditionalStatistics() {
  const t = useTranslations('AdditionalStatistics');

  const stats = [
    { 
      icon: <Users className="w-12 h-12 text-[#162C66]" />,
      value: '50k+', 
      label: t('users'),
      desc: t('usersDesc')
    },
    { 
      icon: <Briefcase className="w-12 h-12 text-[#162C66]" />,
      value: '12k+', 
      label: t('jobs'),
      desc: t('jobsDesc')
    },
    { 
      icon: <Building2 className="w-12 h-12 text-[#162C66]" />,
      value: '2.5k+', 
      label: t('companies'),
      desc: t('companiesDesc')
    },
    { 
      icon: <Calendar className="w-12 h-12 text-[#162C66]" />,
      value: '2020', 
      label: t('since'),
      desc: t('sinceDesc')
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#F7F7F7] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="text-center group"
            >
              <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-slate-100 group-hover:shadow-xl group-hover:border-[#F5C400]/30 transition-all">
                  {stat.icon}
                </div>
              </div>
              
              <div className="text-5xl lg:text-7xl font-black text-[#162C66] mb-3 tracking-tighter leading-none">
                {stat.value}
              </div>
              
              <div className="text-lg lg:text-xl font-black text-[#162C66] mb-3 uppercase tracking-wide">
                {stat.label}
              </div>
              
              <p className="text-sm lg:text-base text-[#666666] font-medium leading-relaxed max-w-xs mx-auto">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#F5C400] rounded-full opacity-[0.03] blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#162C66] rounded-full opacity-[0.02] blur-3xl" />
      </div>
    </section>
  );
}
