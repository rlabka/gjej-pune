'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { FileText, Users, Handshake, ChevronRight } from 'lucide-react';

export default function HowItWorks() {
  const t = useTranslations('HowItWorks');

  const steps = [
    {
      icon: <FileText className="w-10 h-10 text-[#162C66]" />,
      title: t('step1Title'),
      desc: t('step1Desc'),
      link: t('step1Link'),
      num: '01'
    },
    {
      icon: <Users className="w-10 h-10 text-[#162C66]" />,
      title: t('step2Title'),
      desc: t('step2Desc'),
      link: t('step2Link'),
      num: '02'
    },
    {
      icon: <Handshake className="w-10 h-10 text-[#162C66]" />,
      title: t('step3Title'),
      desc: t('step3Desc'),
      link: t('step3Link'),
      num: '03'
    }
  ];

  return (
    <section id="how-it-works" className="py-10 sm:py-14 lg:py-24 bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-10 sm:mb-14 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-[2.75rem] font-bold text-[#162C66] mb-4 sm:mb-6 leading-tight">{t('title')}</h2>
          <div className="w-16 sm:w-20 h-1.5 sm:h-2 bg-[#F5C400] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-16 relative">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="relative group z-10 h-full"
            >
              <div className="flex flex-col items-center h-full">
                <div className="relative mb-6 sm:mb-10">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F5C400] rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-lg shadow-[#F5C400]/20">
                    <div>
                      {step.icon}
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-3 w-9 h-9 sm:w-11 sm:h-11 bg-[#162C66] text-[#F5C400] rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg border-4 border-[#F7F7F7] shadow-xl">
                    {step.num}
                  </div>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-bold text-[#162C66] mb-3 sm:mb-4 leading-tight">{step.title}</h3>
                <p className="text-[#333333] leading-relaxed max-w-xs mx-auto text-[15px] sm:text-base font-medium mb-5 sm:mb-6 flex-grow">
                  {step.desc}
                </p>
                
                <button className="flex items-center space-x-1 text-[#162C66] font-bold text-sm sm:text-[15px] uppercase tracking-widest hover:text-[#F5C400] transition-colors group/link mt-auto">
                  <span>{step.link}</span>
                  <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {/* Curved Connector for desktop */}
              {index < 2 && (
                <div className="hidden md:block absolute top-14 left-[calc(100%-4rem)] w-full h-20 -z-0">
                  <svg className="w-full h-full text-slate-300" viewBox="0 0 100 40" fill="none">
                    <path 
                      d="M0,20 C30,5 70,35 100,20" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeDasharray="6 4" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
