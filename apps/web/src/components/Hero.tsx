'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase } from 'lucide-react';

export default function Hero() {
  const t = useTranslations('Hero');

  return (
    <section className="relative bg-white pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 bg-[#F7F7F7] border border-slate-100 px-5 py-2.5 rounded-full mb-8">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5C400] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F5C400]"></span>
                </span>
                <span className="text-xs font-bold text-[#162C66] uppercase tracking-[0.1em]">Karriere-Plattform Schweiz</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-[#162C66] leading-[1.05] mb-8">
                {t('title')}
              </h1>
              
              <p className="text-lg lg:text-xl text-[#333333] mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t('subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <button className="w-full sm:w-auto bg-[#F5C400] text-[#162C66] px-10 py-5 rounded-2xl font-black text-lg hover:bg-[#ffe533] transition-all shadow-xl hover:shadow-[#F5C400]/30 flex items-center justify-center space-x-3">
                  <span>{t('primaryCTA')}</span>
                  <ArrowRight size={22} strokeWidth={3} />
                </button>
                
                <button className="w-full sm:w-auto bg-white text-[#162C66] border-2 border-[#162C66] px-10 py-5 rounded-2xl font-black text-lg hover:bg-[#162C66] hover:text-white transition-all flex items-center justify-center space-x-2">
                  <span>{t('secondaryCTA')}</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Image */}
          <div className="flex-1 relative">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10"
            >
              <div className="aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(22,44,102,0.15)] relative border-8 border-white">
                <img 
                  src="/hero-image.png" 
                  alt="Professional Career Growth"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#162C66]/10 to-transparent" />
              </div>
              
              {/* Background Brand Shapes */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F5C400] rounded-full opacity-30 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-[#162C66] rounded-full opacity-5 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
