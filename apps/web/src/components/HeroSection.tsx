'use client';

import { motion } from 'framer-motion';
import { Search, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { getSession } from '@/lib/auth';
import { getThemeConfig, CONFIG_UPDATED_EVENT } from '@/lib/siteConfig';
import { resolveImageUrl } from '@/lib/imageUrl';
import LocationAutocomplete from '@/components/LocationAutocomplete';

const DEFAULT_HERO_IMAGE = '/hero-v3.png';

export default function HeroSection() {
  const t = useTranslations('Hero');
  const router = useRouter();
  const locale = useLocale();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [userType, setUserType] = useState<'job-seeker' | 'employer'>('job-seeker');
  const [location, setLocation] = useState('');
  const cmsHeroImage = t.has('heroImage') ? t('heroImage') : '';
  const [heroImageUrl, setHeroImageUrl] = useState(() => resolveImageUrl(cmsHeroImage || getThemeConfig().heroImageUrl || DEFAULT_HERO_IMAGE));

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s?.role === 'employer') setUserType('employer');
    setHeroImageUrl(resolveImageUrl(cmsHeroImage || getThemeConfig().heroImageUrl || DEFAULT_HERO_IMAGE));
    const handler = () => setHeroImageUrl(resolveImageUrl(cmsHeroImage || getThemeConfig().heroImageUrl || DEFAULT_HERO_IMAGE));
    window.addEventListener(CONFIG_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handler);
  }, [cmsHeroImage]);

  const handleSearch = () => {
    const session = getSession();

    // Build the target search URL
    const targetPath = userType === 'employer'
      ? `/candidates${location ? `?location=${encodeURIComponent(location)}` : ''}`
      : `/jobs${location ? `?location=${encodeURIComponent(location)}` : ''}`;

    // Not logged in → redirect to register with role + returnUrl
    if (!session) {
      const params = new URLSearchParams();
      params.set('role', userType);
      params.set('returnUrl', `/${locale}${targetPath}`);
      window.location.href = `/${locale}/auth/register?${params.toString()}`;
      return;
    }

    // Logged in → navigate to search results
    router.push(targetPath);
  };
  
  return (
    <section className="relative bg-white lg:min-h-[calc(100vh-64px)] flex items-start lg:items-center overflow-hidden py-8 sm:py-12 lg:py-0">
      {/* Integrated Image for large screens */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
        <div className="relative w-full h-full">
          <img 
            src={heroImageUrl} 
            alt="Professional job marketplace illustration"
            className="w-full h-full object-cover object-center"
          />
          {/* Seamless blend gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12">
          
          {/* Content Column */}
          <div className="w-full lg:w-3/5 text-center lg:text-left py-4 sm:py-8 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-[1.65rem] sm:text-4xl lg:text-6xl font-extrabold text-[#162C66] leading-[1.1] mb-4 sm:mb-6">
                {t.rich('title', {
                  marker: (chunks) => (
                    <span className="relative inline-block">
                      <span className="relative z-10">{chunks}</span>
                      <svg 
                        className="absolute -bottom-2 left-0 w-full h-3 text-[#F5C400]" 
                        viewBox="0 0 100 15" 
                        preserveAspectRatio="none"
                      >
                        <path 
                          d="M0 10 Q 25 15 50 10 T 100 10" 
                          stroke="currentColor" 
                          strokeWidth="4" 
                          fill="none" 
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  )
                })}
              </h1>
              
              <p className="text-sm sm:text-base lg:text-lg text-[#333333] mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t('subtitle')}
              </p>
              
              {/* Radio Buttons – only for non-logged-in users */}
              {!session && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mb-6 sm:mb-8 w-fit mx-auto lg:mx-0">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="userType"
                      value="job-seeker"
                      checked={userType === 'job-seeker'}
                      onChange={() => setUserType('job-seeker')}
                      className="w-5 h-5 text-[#F5C400] border-2 border-slate-300 focus:ring-[#F5C400] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-base font-bold text-[#162C66] group-hover:text-[#F5C400] transition-colors whitespace-nowrap">
                      {t('lookingForJob')}
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="userType"
                      value="employer"
                      checked={userType === 'employer'}
                      onChange={() => setUserType('employer')}
                      className="w-5 h-5 text-[#F5C400] border-2 border-slate-300 focus:ring-[#F5C400] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-base font-bold text-[#162C66] group-hover:text-[#F5C400] transition-colors whitespace-nowrap">
                      {t('lookingForEmployees')}
                    </span>
                  </label>
                </div>
              )}
              
              {/* Search Form */}
              <div className="max-w-xl mx-auto lg:mx-0 bg-white/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-2xl sm:rounded-[2rem] shadow-xl border border-slate-100">
                <div className="space-y-3 sm:space-y-4">
                  <LocationAutocomplete
                    value={location}
                    onChange={setLocation}
                    placeholder={t('cityPlaceholder')}
                    iconSize={18}
                    iconClassName="text-slate-400 left-4 sm:left-5"
                    inputClassName="w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 bg-[#F7F7F7] border-none rounded-xl sm:rounded-[1.5rem] text-[#162C66] font-semibold text-sm sm:text-base focus:ring-2 focus:ring-[#F5C400] outline-none transition-all"
                  />
                  
                  <button
                    onClick={handleSearch}
                    className="w-full bg-[#F5C400] text-[#162C66] px-8 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] font-bold text-base sm:text-lg hover:bg-[#ffe533] transition-all shadow-lg hover:shadow-[#F5C400]/20 flex items-center justify-center space-x-2 sm:space-x-3"
                    aria-label={t('searchNow')}
                  >
                    <Search size={24} strokeWidth={3} />
                    <span>{t('searchNow')}</span>
                  </button>
                </div>
              </div>
              
              {/* Trust Badge / Social Proof */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mt-8">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={20} className="fill-[#F5C400] text-[#F5C400]" />
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-sm">
                  <span className="font-bold text-[#162C66]">{t('trustBadge')}</span>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <span className="text-slate-500">{t('trustBadgeDesc')}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Image for mobile screens */}
          <div className="w-full lg:hidden pb-12">
            <div className="rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src={heroImageUrl} 
                alt="Professional job marketplace illustration"
                className="w-full aspect-[16/9] object-cover object-center"
              />
            </div>
          </div>

        </div>
      </div>
      
      {/* Decorative Brand Shapes */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#F5C400] rounded-full opacity-[0.03] blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#162C66] rounded-full opacity-[0.02] blur-3xl pointer-events-none" />
    </section>
  );
}
