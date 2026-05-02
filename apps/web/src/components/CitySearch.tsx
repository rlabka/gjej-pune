'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Search, MoreHorizontal, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { resolveImageUrl } from '@/lib/imageUrl';

export default function CitySearch() {
  const t = useTranslations('CitySearch');
  const [postcode, setPostcode] = useState('');

  const cities = [
    t('country1'), t('country2'), t('country3'), t('country4'),
    t('country5'), t('country6'), t('country7'), t('country8')
  ];

  return (
    <section className="py-10 sm:py-14 lg:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-[2.75rem] font-bold text-[#162C66] mb-6 sm:mb-10 leading-tight">
            {t('title')}
          </h2>
          
          {/* City List */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 mb-10 sm:mb-14">
            {cities.map((city, index) => (
              <motion.a
                key={city}
                href={`#${city.toLowerCase()}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, backgroundColor: '#F5C400', color: '#162C66', borderColor: '#F5C400' }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-full border-2 border-slate-200 text-xs sm:text-sm lg:text-base font-semibold text-slate-600 hover:text-[#162C66] transition-all cursor-pointer"
              >
                {city}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(22,44,102,0.15)] border border-slate-100 p-4 sm:p-6 lg:p-8 overflow-hidden relative"
        >
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            {/* Left: Search Interface */}
            <div className="flex-1 w-full">
              <h3 className="text-lg sm:text-xl lg:text-3xl font-bold text-[#162C66] mb-2 sm:mb-3 leading-tight">
                {t('searchTitle')}
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-[#666666] font-medium mb-4 sm:mb-6 leading-relaxed">
                {t('searchDesc')}
              </p>
              
              {/* Search Input Group */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <div className="flex-1 relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F5C400] transition-colors w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('postcodePlaceholder')}
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[#162C66] font-bold text-base focus:border-[#F5C400] focus:ring-4 focus:ring-[#F5C400]/10 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                
                <button className="flex-none bg-[#162C66] hover:bg-[#1f3c8a] text-white px-8 py-4 rounded-xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>{t('searchButton')}</span>
                </button>
              </div>
            </div>

            {/* Right: Illustration Placeholder */}
            <div className="hidden lg:block flex-1 max-w-md relative">
              <div className="absolute inset-0 bg-[#F5C400] rounded-[2rem] rotate-3 opacity-20" />
              <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
                <img 
                  src={resolveImageUrl(t.has('sectionImage') ? t('sectionImage') : 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80')}
                  alt="Office working environment"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#162C66]/80 to-transparent flex flex-col justify-end p-8">
                  <div className="w-12 h-12 bg-[#F5C400] rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <Briefcase className="w-6 h-6 text-[#162C66]" />
                  </div>
                  <p className="text-white font-bold text-xl leading-tight">
                    {t('imageOverlayText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
