'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function InfoCarousel() {
  const t = useTranslations('InfoCarousel');
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    [
      {
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        title: t('slide1_card1_title'),
        bgColor: 'bg-[#F7F7F7]'
      },
      {
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
        title: t('slide1_card2_title'),
        bgColor: 'bg-[#F7F7F7]'
      },
      {
        image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
        title: t('slide1_card3_title'),
        bgColor: 'bg-[#F7F7F7]'
      }
    ],
    [
      {
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        title: t('slide2_card1_title'),
        bgColor: 'bg-[#F7F7F7]'
      },
      {
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
        title: t('slide2_card2_title'),
        bgColor: 'bg-[#F7F7F7]'
      },
      {
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
        title: t('slide2_card3_title'),
        bgColor: 'bg-[#F7F7F7]'
      }
    ]
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="py-10 sm:py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl lg:text-[2rem] font-bold text-[#162C66] leading-tight mb-3">
              {t('title')}
            </h2>
            <div className="w-16 h-1.5 bg-[#F5C400] rounded-full" />
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={prevSlide}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-[#F5C400] hover:text-[#F5C400] flex items-center justify-center transition-all shadow-sm hover:shadow-md group/nav"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-[#162C66] group-hover/nav:-translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={nextSlide}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:border-[#F5C400] hover:text-[#F5C400] flex items-center justify-center transition-all shadow-sm hover:shadow-md group/nav"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-[#162C66] group-hover/nav:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 lg:gap-10"
            >
              {slides[currentSlide].map((card, index) => (
                <motion.div
                  key={`${currentSlide}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-[#F7F7F7] rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-slate-100 hover:border-[#F5C400] hover:bg-white hover:shadow-[0_16px_32px_-8px_rgba(22,44,102,0.1)] transition-all duration-500 group cursor-pointer flex flex-col h-full"
                >
                  <div className="relative aspect-[16/9] rounded-xl sm:rounded-[1.5rem] overflow-hidden mb-4 sm:mb-6 shadow-sm group-hover:shadow-md transition-all duration-500">
                    <img 
                      src={card.image} 
                      alt={card.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#162C66]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-between">
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-[#162C66] leading-tight group-hover:text-[#F5C400] transition-colors duration-300 mb-3 sm:mb-4">
                      {card.title}
                    </h3>
                    
                    <div className="mt-auto flex items-center text-[#162C66] font-bold group-hover:text-[#F5C400] transition-colors text-sm">
                      <span className="mr-2 uppercase tracking-wide">Mehr erfahren</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center items-center space-x-2 mt-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? 'bg-[#162C66] w-8 shadow-sm'
                  : 'bg-slate-200 w-2 hover:bg-slate-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
