'use client';

import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'list';
}

export default function LanguageSwitcher({ variant = 'dropdown' }: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations('common.languageSwitcher');
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  type AppLocale = 'de' | 'en' | 'fr' | 'it' | 'sq';

  const switchLocale = (newLocale: AppLocale) => {
    // Notify forms to save their state before locale change
    window.dispatchEvent(new Event('locale-change'));
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
    // Persist locale to DB (fire-and-forget)
    const token = getToken();
    if (token) api.patch('/api/auth/locale', { locale: newLocale }, token).catch(() => {});
  };

  const languages: Array<{ code: AppLocale; label: string; short: string }> = [
    { code: 'de', label: t('label.de'), short: t('short.de') },
    { code: 'en', label: t('label.en'), short: t('short.en') },
    { code: 'fr', label: t('label.fr'), short: t('short.fr') },
    { code: 'it', label: t('label.it'), short: t('short.it') },
    { code: 'sq', label: t('label.sq'), short: t('short.sq') }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Variant: LIST (Footer Style) ---
  if (variant === 'list') {
    return (
      <div className="flex items-center space-x-6">
        <Globe size={18} className="text-white/55" />
        <div className="flex items-center space-x-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={clsx(
                'text-[12px] font-semibold transition-colors duration-150 ease-out tracking-[0.14em] uppercase',
                locale === lang.code 
                  ? 'text-white/90' 
                  : 'text-white/40 hover:text-white/75'
              )}
            >
              {lang.short}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Variant: DROPDOWN (Header Style) ---
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors duration-150 ease-out text-[#162C66] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#162C66]/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <Globe
          size={18}
          strokeWidth={2.5}
          className="text-[#162C66]/60 group-hover:text-[#162C66]/80 transition-colors duration-150 ease-out"
        />
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">{locale}</span>
        <ChevronDown 
          size={16} 
          className={clsx(
            'text-[#162C66]/40 group-hover:text-[#162C66]/60',
            isOpen ? 'rotate-180' : 'rotate-0'
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] border border-slate-200/60 py-2 z-[100]">
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{t('title')}</span>
          </div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2.5 text-[14px] font-semibold transition-colors duration-150 ease-out rounded-lg',
                locale === lang.code 
                  ? 'text-[#162C66] bg-slate-50'
                  : 'text-slate-600 hover:text-[#162C66] hover:bg-slate-50'
              )}
            >
              <span>{lang.label}</span>
              {locale === lang.code && (
                <Check size={18} className="text-[#162C66]" strokeWidth={2.75} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
