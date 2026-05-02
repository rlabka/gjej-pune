'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Zap, Building2, Search, ChevronRight } from 'lucide-react';
import { resolveImageUrl } from '@/lib/imageUrl';

export default function ServicesOverview() {
  const tWhat = useTranslations('WhatAreYouLookingFor');
  const tServices = useTranslations('AdditionalServices');

  const options = [
    { title: tWhat('option1'), href: '#jobs' },
    { title: tWhat('option2'), href: '#employers' }
  ];

  const services = [
    {
      subtitle: tServices('jobs'),
      desc: tServices('jobsDesc'),
      icon: <Briefcase className="w-6 h-6 text-[#162C66]" />,
      gradient: 'from-blue-50 to-blue-100/50',
      image: tServices.has('jobsImage') ? tServices('jobsImage') : 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop'
    },
    {
      subtitle: tServices('freelance'),
      desc: tServices('freelanceDesc'),
      icon: <Zap className="w-6 h-6 text-[#162C66]" />,
      gradient: 'from-yellow-50 to-yellow-100/50',
      image: tServices.has('freelanceImage') ? tServices('freelanceImage') : 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop'
    },
    {
      subtitle: tServices('companies'),
      desc: tServices('companiesDesc'),
      icon: <Building2 className="w-6 h-6 text-[#162C66]" />,
      gradient: 'from-slate-50 to-slate-100/50',
      image: tServices.has('companiesImage') ? tServices('companiesImage') : 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=300&fit=crop'
    },
    {
      subtitle: tServices('recruiting'),
      desc: tServices('recruitingDesc'),
      icon: <Search className="w-6 h-6 text-[#162C66]" />,
      gradient: 'from-blue-50 to-indigo-50',
      image: tServices.has('recruitingImage') ? tServices('recruitingImage') : 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=300&fit=crop'
    }
  ];

  return (
    <section className="py-10 sm:py-14 lg:py-24 bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA Cards: What are you looking for? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-xl sm:text-2xl lg:text-[2.75rem] font-bold text-[#162C66] leading-tight mb-8 sm:mb-12">
            {tWhat('title')}
            <span className="inline-block bg-[#F5C400] text-white px-4 py-2 rounded-2xl mx-2">
              {tWhat('titleHighlight')}
            </span>
            {tWhat('titleEnd')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {options.map((option, index) => (
              <motion.a
                key={index}
                href={option.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl border-2 border-transparent hover:border-[#F5C400] transition-all duration-300 group flex items-center justify-between cursor-pointer"
              >
                <span className="text-base sm:text-xl lg:text-2xl font-bold text-[#162C66] group-hover:text-[#F5C400] transition-colors">
                  {option.title}
                </span>
                <ArrowRight
                  size={24}
                  className="text-[#162C66] group-hover:text-[#F5C400] group-hover:translate-x-2 transition-all duration-300"
                />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="mt-10 sm:mt-16">
          <div className="mb-8 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl lg:text-[2.75rem] font-bold text-[#162C66] mb-3 sm:mb-4">{tServices('title')}</h3>
            <p className="text-sm sm:text-base lg:text-lg text-[#666666] font-medium">{tServices('description')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className={`relative h-[180px] sm:h-[220px] lg:h-[240px] rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${service.gradient} border border-slate-100 hover:shadow-xl transition-all duration-500 group cursor-pointer`}
              >
                <div className="absolute inset-0 flex">
                  <div className="flex-1 p-5 sm:p-8 lg:p-10 flex flex-col justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        {service.icon}
                      </div>
                      <span className="text-base sm:text-xl font-bold text-[#162C66] whitespace-nowrap">{service.subtitle}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[#162C66] font-bold group-hover:text-[#F5C400] transition-colors">
                      <span className="text-sm uppercase tracking-wider whitespace-nowrap">{tServices('moreInfo')}</span>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

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
      </div>
    </section>
  );
}
