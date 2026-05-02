'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { resolveImageUrl } from '@/lib/imageUrl';

export default function Testimonials() {
  const t = useTranslations('Testimonials');

  const reviews = [
    {
      name: t('review1_name'),
      city: t('review1_city'),
      text: t('review1_text'),
      img: t.has('review1_img') ? t('review1_img') : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: t('review2_name'),
      city: t('review2_city'),
      text: t('review2_text'),
      img: t.has('review2_img') ? t('review2_img') : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: t('review3_name'),
      city: t('review3_city'),
      text: t('review3_text'),
      img: t.has('review3_img') ? t('review3_img') : 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200'
    }
  ];

  return (
    <section className="py-10 sm:py-14 lg:py-24 bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-[2.75rem] font-bold text-[#162C66] mb-4 sm:mb-6 leading-tight">{t('title')}</h2>
          <div className="w-16 sm:w-20 h-1.5 sm:h-2 bg-[#F5C400] mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 lg:gap-12">
          {reviews.map((review, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.05)] border border-slate-50 relative group hover:shadow-2xl transition-all duration-500 text-left"
            >
              <div className="absolute top-6 right-6 sm:top-10 sm:right-10 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity">
                <Quote size={48} fill="#162C66" />
              </div>
              
              <div className="flex items-center space-x-4 sm:space-x-5 mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-3 sm:border-4 border-[#F7F7F7] shadow-sm">
                  <img src={resolveImageUrl(review.img)} alt={review.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-[#162C66]">{review.name}</h4>
                  <p className="text-[11px] sm:text-[13px] font-bold text-[#F5C400] uppercase tracking-widest">{review.city}</p>
                </div>
              </div>
              
              <p className="text-[#333333] leading-relaxed font-medium italic text-sm sm:text-base">
                &ldquo;{review.text}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
