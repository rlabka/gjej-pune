'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

export default function Statistics() {
  const t = useTranslations('Statistics');

  const stats = [
    { value: '50k+', label: t('users') },
    { value: '12k+', label: t('jobs') },
    { value: '2.5k+', label: t('companies') },
    { value: '2020', label: t('since') },
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#162C66]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-5xl lg:text-8xl font-black text-[#F5C400] mb-5 tracking-tighter">
                {stat.value}
              </div>
              <div className="text-xs lg:text-[15px] font-black text-white/60 uppercase tracking-[0.2em] px-4">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
