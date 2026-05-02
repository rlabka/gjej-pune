'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  const t = useTranslations('CTASection');

  return (
    <section className="py-12 lg:py-20 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-[#162C66]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#162C66] to-[#1a3a7a] opacity-90" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5C400] rounded-full opacity-[0.03] blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full opacity-[0.03] blur-3xl" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            <h2 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
              {t('title')}
            </h2>
          </motion.div>

          {/* Right: CTA Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex-shrink-0"
          >
            <button className="bg-white text-[#162C66] px-8 py-4 rounded-xl font-bold text-base lg:text-lg hover:bg-[#F5C400] hover:text-[#162C66] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center space-x-2 group">
              <span>{t('cta')}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
