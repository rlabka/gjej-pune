'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function WhatAreYouLookingFor() {
  const t = useTranslations('WhatAreYouLookingFor');

  const options = [
    {
      title: t('option1'),
      href: '#jobs'
    },
    {
      title: t('option2'),
      href: '#employers'
    }
  ];

  return (
    <section className="py-10 sm:py-14 lg:py-24 bg-[#F7F7F7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl lg:text-[2.75rem] font-bold text-[#162C66] leading-tight">
            {t('title')}
            <span className="inline-block bg-[#F5C400] text-white px-4 py-2 rounded-2xl mx-2">
              {t('titleHighlight')}
            </span>
            {t('titleEnd')}
          </h2>
        </motion.div>

        {/* Options Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
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
      </div>
    </section>
  );
}
