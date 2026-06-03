'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Briefcase, Zap, Building2, Search, ChevronRight } from 'lucide-react';
import { resolveImageUrl } from '@/lib/imageUrl';

export default function AdditionalServices() {
  const t = useTranslations('AdditionalServices');

  const services = [
    {
      title: 'gjejpune24',
      subtitle: t('jobs'),
      link: t('jobsDesc'),
      icon: <Briefcase className="w-6 h-6 text-[#162C66]" />,
      gradient: 'from-blue-50 to-blue-100/50',
      image: t.has('jobsImage') ? t('jobsImage') : 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop',
      textColor: 'text-[#162C66]'
    },
    {
      title: 'gjejpune24',
      subtitle: t('freelance'),
      link: t('freelanceDesc'),
      icon: <Zap className="w-6 h-6 text-[#162C66]" />,
      gradient: 'from-yellow-50 to-yellow-100/50',
      image: t.has('freelanceImage') ? t('freelanceImage') : 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop',
      textColor: 'text-[#162C66]'
    },
    {
      title: 'gjejpune24',
      subtitle: t('companies'),
      link: t('companiesDesc'),
      icon: <Building2 className="w-6 h-6 text-[#162C66]" />,
      gradient: 'from-slate-50 to-slate-100/50',
      image: t.has('companiesImage') ? t('companiesImage') : 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=300&fit=crop',
      textColor: 'text-[#162C66]'
    },
    {
      title: 'gjejpune24',
      subtitle: t('recruiting'),
      link: t('recruitingDesc'),
      icon: <Search className="w-6 h-6 text-[#162C66]" />,
      gradient: 'from-blue-50 to-indigo-50',
      image: t.has('recruitingImage') ? t('recruitingImage') : 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=300&fit=crop',
      textColor: 'text-[#162C66]'
    }
  ];

  return (
    <section className="py-10 sm:py-14 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-[2.75rem] font-bold text-[#162C66] mb-3 sm:mb-4">{t('title')}</h2>
          <p className="text-sm sm:text-base lg:text-lg text-[#666666] font-medium">{t('description')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {services.map((service, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 1 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className={`relative h-[180px] sm:h-[220px] lg:h-[240px] rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${service.gradient} border border-slate-100 hover:shadow-xl transition-all duration-500 group cursor-pointer`}
            >
              <div className="absolute inset-0 flex">
                {/* Left: Content */}
                <div className="flex-1 p-5 sm:p-8 lg:p-10 flex flex-col justify-between relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {service.icon}
                    </div>
                    <span className="text-base sm:text-xl font-bold text-[#162C66] whitespace-nowrap">{service.subtitle}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-[#162C66] font-bold group-hover:text-[#F5C400] transition-colors">
                    <span className="text-sm uppercase tracking-wider whitespace-nowrap">{t('moreInfo')}</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Right: Illustration */}
                <div className="w-1/3 lg:w-2/5 relative overflow-hidden bg-slate-200">
                  <img
                    src={resolveImageUrl(service.image)}
                    alt=""
                    loading="eager"
                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-20 group-hover:opacity-100 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:from-white/10" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
