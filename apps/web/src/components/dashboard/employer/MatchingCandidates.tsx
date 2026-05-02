'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { MapPin, ArrowRight, ChevronLeft, ChevronRight, Zap, Crown, Clock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { useCategoryHelpers, type Locale } from '@/hooks/useCategories';
import { translateExperience } from '@/lib/skillsTranslation';
import { translateLocation } from '@/lib/location';
import { clsx } from 'clsx';

const LANG_FLAGS: Record<string, string> = { sq: '🇦🇱', de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', it: '🇮🇹', el: '🇬🇷', tr: '🇹🇷', sr: '🇷🇸', mk: '🇲🇰', es: '🇪🇸', pt: '🇵🇹', ro: '🇷🇴', pl: '🇵🇱', nl: '🇳🇱', ru: '🇷🇺', ar: '🇸🇦' };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function resolvePhoto(url: string | null, name: string): string {
  if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=162C66&color=fff&size=200&bold=true`;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

interface MatchCandidate {
  id: string;
  category: string;
  firstName: string;
  age: number | null;
  photoUrl: string | null;
  experience: string | null;
  livingPlace: string | null;
  skills: string[];
  spokenLanguages?: string[];
  score: number;
  isBoosted: boolean;
}

const loc = {
  de: { matching: 'Vorgeschlagene Kandidaten', viewAll: 'Alle ansehen', match: 'Match', experience: 'Erfahrung' },
  en: { matching: 'Suggested candidates', viewAll: 'See all', match: 'Match', experience: 'Experience' },
  fr: { matching: 'Candidats suggérés', viewAll: 'Voir tous', match: 'Correspondance', experience: 'Expérience' },
  it: { matching: 'Candidati suggeriti', viewAll: 'Vedi tutti', match: 'Corrispondenza', experience: 'Esperienza' },
  sq: { matching: 'Kandidatët e sugjeruar', viewAll: 'Shiko të gjithë', match: 'Përputhje', experience: 'Përvoja' },
} as const;

export default function MatchingCandidates({ jobId, jobCategory }: { jobId: string; jobCategory: string }) {
  const locale = useLocale() as keyof typeof loc;
  const t = loc[locale] ?? loc.de;
  const { translateTitle } = useCategoryHelpers();
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    api.get<{ ok: boolean; candidates: MatchCandidate[] }>(`/api/jobs/${jobId}/matching-candidates`)
      .then((res) => { if (res.ok) setCandidates(res.candidates); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [jobId]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [candidates]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.55 : el.clientWidth * 0.55, behavior: 'smooth' });
  };

  if (!loaded || candidates.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Zap size={15} className="text-amber-500" />
          </div>
          <h4 className="text-[13px] sm:text-[14px] font-semibold text-[#0B1F44] truncate">{t.matching}</h4>
          <span className="text-[11px] sm:text-[12px] font-semibold text-[#162C66]/70 bg-white min-w-[22px] h-[22px] sm:min-w-[24px] sm:h-6 rounded-lg flex items-center justify-center px-1.5 sm:px-2 tabular-nums border border-slate-200/60 shadow-sm shrink-0">{candidates.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {candidates.length > 2 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center border transition-all',
                  canScrollLeft ? 'border-slate-200 bg-white text-slate-500 hover:text-[#0B1F44] hover:border-slate-300 shadow-sm' : 'border-transparent bg-transparent text-slate-200 cursor-default'
                )}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center border transition-all',
                  canScrollRight ? 'border-slate-200 bg-white text-slate-500 hover:text-[#0B1F44] hover:border-slate-300 shadow-sm' : 'border-transparent bg-transparent text-slate-200 cursor-default'
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <Link
            href={`/candidates?category=${encodeURIComponent(jobCategory)}`}
            className="text-[13px] font-semibold text-[#162C66] hover:text-[#0B1F44] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
          >
            {t.viewAll}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {canScrollLeft && <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none rounded-l-xl" />}
        {canScrollRight && <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none rounded-r-xl" />}

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-1">
          {candidates.map((c) => {
            const pct = Math.min(100, Math.round(c.score));
            const langs = Array.isArray(c.spokenLanguages) ? c.spokenLanguages : [];
            return (
              <Link
                key={c.id}
                href={`/candidates?id=${c.id}`}
                className="group relative min-w-[200px] sm:min-w-[220px] w-[200px] sm:w-[220px] rounded-xl bg-white border border-slate-200/60 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 shrink-0 overflow-hidden"
              >
                {/* Photo */}
                <div className="relative h-[140px] sm:h-[160px] overflow-hidden bg-slate-100">
                  <img
                    src={resolvePhoto(c.photoUrl, c.firstName)}
                    alt={c.firstName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Match badge */}
                  <div className="absolute top-2 right-2">
                    <span className={clsx(
                      'text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm tabular-nums',
                      pct >= 80 ? 'bg-emerald-500/90 text-white'
                        : pct >= 60 ? 'bg-blue-500/90 text-white'
                        : pct >= 40 ? 'bg-amber-500/90 text-white'
                        : 'bg-slate-700/70 text-white'
                    )}>
                      {pct}%
                    </span>
                  </div>
                  {/* Boosted badge */}
                  {c.isBoosted && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center shadow-sm">
                      <Crown size={12} className="text-white" />
                    </div>
                  )}
                  {/* Bottom gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-3 sm:p-3.5">
                  <h5 className="text-[14px] font-bold text-[#0B1F44] truncate mb-0.5">
                    {c.firstName}{c.age ? `, ${c.age}` : ''}
                  </h5>
                  <p className="text-[12px] text-slate-500 truncate mb-2.5">
                    {translateTitle(c.category, locale as Locale)}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {c.experience && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Clock size={10} className="text-emerald-500" />{translateExperience(c.experience, locale)}
                      </span>
                    )}
                    {c.livingPlace && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                        <MapPin size={10} className="text-slate-400 shrink-0" />{translateLocation(c.livingPlace, locale).split(',')[0]}
                      </span>
                    )}
                    {langs.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md">
                        {langs.slice(0, 3).map((l) => <span key={l} className="text-[12px]">{LANG_FLAGS[l] || '🌐'}</span>)}
                        {langs.length > 3 && <span className="text-[10px] text-slate-400 ml-0.5">+{langs.length - 3}</span>}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
