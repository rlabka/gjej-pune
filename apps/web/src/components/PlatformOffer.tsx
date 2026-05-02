'use client';

import { useTranslations } from 'next-intl';
import { Check, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlatformOffer() {
  const t = useTranslations('PlatformOffer');

  const bullets = [
    { bold: t('bullet1_bold'), normal: t('bullet1_normal') },
    { bold: t('bullet2_bold'), normal: t('bullet2_normal') },
    { bold: t('bullet3_bold'), normal: t('bullet3_normal') },
    { bold: t('bullet4_bold'), normal: t('bullet4_normal') },
  ];

  return (
    <section className="py-10 sm:py-14 lg:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-10 sm:gap-14 lg:gap-24">
          
          {/* Left: Mobile UI Mockup (Inspired by the first image's results list feel) */}
          <div className="flex-1 relative order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto max-w-[340px]"
            >
              {/* Device Frame */}
              <div className="relative z-10 bg-[#162C66] rounded-[3.5rem] p-4 shadow-[0_48px_96px_-16px_rgba(22,44,102,0.25)] border-4 border-slate-50">
                <div className="bg-[#F7F7F7] rounded-[2.8rem] overflow-hidden aspect-[9/19.5] relative">
                  {/* Mock App UI */}
                  <div className="flex flex-col h-full bg-white">
                    {/* App Header */}
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-8 h-8 bg-[#F5C400] rounded-lg flex items-center justify-center font-black text-[#162C66] text-xs">GP</div>
                        <div className="flex space-x-1.5">
                          <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                          <div className="w-4 h-1.5 bg-slate-200 rounded-full" />
                        </div>
                      </div>
                      <div className="text-[13px] font-black text-[#162C66] mb-3">Find Professionals</div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-[#F7F7F7] rounded-lg py-2 px-3 flex items-center space-x-2">
                          <div className="w-3 h-3 border-2 border-slate-300 rounded-full" />
                          <div className="h-2 bg-slate-200 rounded-full w-12" />
                        </div>
                        <div className="bg-[#162C66] text-white rounded-lg px-3 py-2 text-[10px] font-bold">Filters</div>
                      </div>
                    </div>
                    
                    {/* Profile List */}
                    <div className="flex-1 overflow-hidden p-4 space-y-4">
                      {[
                        { name: 'Arben Z.', loc: '8001 Zürich', exp: '5 years', price: '35', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
                        { name: 'Elena M.', loc: '3005 Bern', exp: '8 years', price: '42', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
                        { name: 'Marc L.', loc: '1201 Genève', exp: '3 years', price: '28', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
                        { name: 'Sarah M.', loc: '4051 Basel', exp: '6 years', price: '38', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' }
                      ].map((profile, i) => (
                        <div key={i} className={`p-3 rounded-2xl border border-slate-100 shadow-sm ${i === 1 ? 'opacity-10' : 'opacity-40'}`}>
                          <div className="flex items-center space-x-3 mb-2">
                            <img src={profile.img} className="w-12 h-12 rounded-full object-cover bg-slate-100 shadow-sm" alt="" />
                            <div className="flex-1">
                              <div className="text-[12px] font-black text-[#162C66]">{profile.name}</div>
                              <div className="text-[9px] text-slate-400 font-bold">{profile.loc}</div>
                            </div>
                            <div className="text-[#162C66] font-black text-[10px]">CHF {profile.price}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex text-[#F5C400] scale-75 origin-left">
                              {[1, 2, 3, 4, 5].map(s => <span key={s}>★</span>)}
                            </div>
                            <div className="text-[8px] font-bold text-slate-400">{profile.exp} exp</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fixed Profile Card (Enlarged images, Static position) */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="hidden md:block absolute -right-20 top-1/4 z-20 bg-white p-6 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(22,44,102,0.22)] border border-slate-100 w-80"
              >
                <div className="flex items-start space-x-5 mb-5">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop" 
                      className="w-20 h-20 rounded-[1.5rem] object-cover shadow-lg"
                      alt="Gabriela"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#F5C400] rounded-full flex items-center justify-center border-4 border-white shadow-md">
                      <Check size={14} className="text-[#162C66]" strokeWidth={4} />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-[18px] font-black text-[#162C66] tracking-tight">Gabriela S.</div>
                      <div className="text-[#F5C400] text-sm">❤</div>
                    </div>
                    <div className="text-[12px] text-slate-400 font-bold mb-3">8004 Zürich (3 km)</div>
                    <div className="flex text-[#F5C400] space-x-0.5">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="#F5C400" className="text-[#F5C400]" />)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="text-[11px] text-slate-500 font-bold">
                    <span className="text-[#162C66] text-[13px]">10 years</span> of exp
                  </div>
                  <div className="text-[18px] font-black text-[#162C66]">CHF 27 <span className="text-[11px] text-slate-400 font-bold">/hr</span></div>
                </div>
              </motion.div>

              {/* Decorative Background Blob */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#F5C400] opacity-[0.05] rounded-full blur-[120px] pointer-events-none" />
            </motion.div>
          </div>

          {/* Right: Content (Inspired by the clean 'Our offer' layout) */}
          <div className="flex-1 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-[2.75rem] font-bold text-[#162C66] mb-8 sm:mb-12 leading-[1.1]">
                {t('title')}
              </h2>
              
              <ul className="space-y-4 sm:space-y-6 mb-10 sm:mb-16">
                {bullets.map((bullet, index) => (
                  <li key={index} className="flex items-center space-x-5 group">
                    <div className="w-8 h-8 bg-[#F5C400] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110">
                      <Check className="text-[#162C66]" size={18} strokeWidth={4} />
                    </div>
                    <p className="text-sm sm:text-base lg:text-[17px] text-[#162C66]">
                      <span className="font-bold">{bullet.bold}</span>
                      <span className="font-medium opacity-80">{bullet.normal}</span>
                    </p>
                  </li>
                ))}
              </ul>
              
              <button className="bg-[#162C66] text-white px-8 sm:px-12 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-[#1f3c8a] transition-all shadow-xl hover:shadow-[#162C66]/30 flex items-center space-x-2 sm:space-x-3">
                <span>{t('cta')}</span>
                <ArrowRight size={20} />
              </button>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
