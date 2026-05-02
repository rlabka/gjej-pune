'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { buildJobsSearchPath } from '@/lib/jobSearchParams';
import { Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import LocationAutocomplete from '@/components/LocationAutocomplete';

export default function JobSeekerSearchBar() {
  const router = useRouter();
  const t = useTranslations('Jobs');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      buildJobsSearchPath({
        keyword: keyword.trim(),
        location: location.trim()
      })
    );
  };

  return (
    <div className="relative lg:sticky lg:top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-5 shadow-sm">
      <div className="max-w-5xl mx-auto">
        <form
          className="flex flex-col lg:flex-row gap-3"
          onSubmit={handleSubmit}
          role="search"
          aria-label={t('searchPlaceholder')}
        >
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} aria-hidden />
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-full text-slate-900 font-medium focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66] outline-none transition-all placeholder:text-slate-400"
                aria-label={t('searchPlaceholder')}
              />
            </div>
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              placeholder={t('locationPlaceholder')}
              iconSize={20}
              iconClassName="text-slate-400 left-4"
              inputClassName="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-full text-slate-900 font-medium focus:ring-2 focus:ring-[#162C66]/10 focus:border-[#162C66] outline-none transition-all placeholder:text-slate-400"
              className="flex-1"
            />
          </div>
          <button
            type="submit"
            className="w-full lg:w-auto h-12 px-8 bg-[#162C66] text-white font-bold rounded-full hover:bg-[#0F1E45] transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
          >
            <Search size={20} strokeWidth={2.5} aria-hidden />
            <span>{t('searchButton')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
