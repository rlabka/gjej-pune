'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Cross, Star, Handshake, Users, FileText, MessageSquare, Clock, Shield, Headphones } from 'lucide-react';

export default function WhyUs() {
  const t = useTranslations('WhyUs');
  const tTrust = useTranslations('TrustAndSafety');

  const mainFeatures = [
    {
      icon: <Cross className="w-6 h-6" />,
      text: t('feature1')
    },
    {
      icon: <Star className="w-6 h-6" />,
      text: t('feature2')
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      text: t('feature3')
    },
    {
      icon: <Users className="w-6 h-6" />,
      text: t('feature4')
    }
  ];

  const trustFeatures = [
    {
      icon: <FileText className="w-5 h-5" />,
      text: tTrust('feature1')
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      text: tTrust('feature2')
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      text: tTrust('feature4')
    }
  ];

  return (
    <section className="py-10 sm:py-14 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content Block */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 mb-10 sm:mb-16">
          {/* Left: Text Content */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-[#162C66] mb-4 sm:mb-6 leading-tight">
              {t('title')}
              <span className="text-[#F5C400]"> {t('titleHighlight')}</span>
            </h2>
            
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-[1.75] mb-4 sm:mb-6 max-w-xl">
              {t('description')}
            </p>

            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-[1.75] mb-8 sm:mb-10 max-w-xl">
              {t('description2')}
            </p>

            {/* Trust & Safety Section */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-xl lg:text-2xl font-bold text-[#162C66] mb-3 leading-tight">
                {tTrust('title')}
              </h3>
              <p className="text-base text-slate-600 leading-[1.75] mb-6 max-w-xl">
                {tTrust('description')}
              </p>
              <a 
                href="#security" 
                className="inline-flex items-center space-x-2 text-[#162C66] font-bold text-sm hover:text-[#F5C400] transition-colors group mb-8"
              >
                <span>{tTrust('securityLink')}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>

              {/* Trust Features List */}
              <div className="space-y-6">
                {trustFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-[#162C66] group-hover:bg-[#162C66] group-hover:text-white transition-all duration-300">
                      {feature.icon}
                    </div>
                    <p className="text-sm lg:text-base text-slate-600 font-medium leading-[1.6] pt-2 group-hover:text-[#162C66] transition-colors">
                      {feature.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80" 
                alt="Professional team"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#162C66]/10 to-transparent" />
            </div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-16">
          {mainFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-[#F8FAFC] p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-transparent hover:border-[#F5C400]/20 transition-all duration-300 group text-center"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#FFF9E6] text-[#F5C400] flex items-center justify-center mx-auto mb-3 sm:mb-6 group-hover:scale-110 group-hover:bg-[#F5C400] group-hover:text-white transition-all duration-300">
                {feature.icon}
              </div>
              <p className="text-sm sm:text-base font-semibold text-[#162C66] leading-relaxed">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Link */}
        <div className="text-center">
          <a 
            href="#about" 
            className="inline-flex items-center space-x-2 text-[#162C66] font-bold text-base hover:text-[#F5C400] transition-colors group"
          >
            <span>{t('cta')}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </div>
    </section>
  );
}
