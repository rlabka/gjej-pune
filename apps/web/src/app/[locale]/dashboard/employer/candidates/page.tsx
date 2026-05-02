'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { shortLocation, shortSuggestionLabel, translateLocation } from '@/lib/location';
import { MapPin, Search, SlidersHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Heart, Share2, Copy, X, Eye, Award, Sparkles, ArrowRight, Briefcase, MessageSquare, Check, User, CalendarDays, Globe, Languages } from 'lucide-react';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { clsx } from 'clsx';
import { SkeletonList } from '@/components/ui/LoadingScreen';
import { useFavorites } from '@/hooks/useFavorites';
import { buildShareUrl, shareWhatsApp, shareFacebook, copyLink } from '@/lib/share';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import type { LocationSuggestion } from '@/hooks/useLocationAutocomplete';
import Button from '@/components/ui/Button';
import FeedbackToast from '@/app/[locale]/dashboard/job-seeker/_components/FeedbackToast';
import { useCategories, getTranslatedTitle, type Locale, type JobCategory } from '@/hooks/useCategories';
import { translateSkills, translateExperience } from '@/lib/skillsTranslation';

export const dynamic = 'force-dynamic';

const CANDIDATES_PER_PAGE = 10;

const LANG_FLAGS: Record<string, string> = { sq: '🇦🇱', de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', it: '🇮🇹', el: '🇬🇷', tr: '🇹🇷', sr: '🇷🇸', mk: '🇲🇰', es: '🇪🇸', pt: '🇵🇹', ro: '🇷🇴', pl: '🇵🇱', nl: '🇳🇱', ru: '🇷🇺', ar: '🇸🇦' };
const LANG_NAMES: Record<string, Record<string, string>> = {
  de: { sq: 'Albanisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', el: 'Griechisch', tr: 'Türkisch', sr: 'Serbisch', mk: 'Mazedonisch', es: 'Spanisch', pt: 'Portugiesisch', ro: 'Rumänisch', pl: 'Polnisch', nl: 'Niederländisch', ru: 'Russisch', ar: 'Arabisch' },
  en: { sq: 'Albanian', de: 'German', en: 'English', fr: 'French', it: 'Italian', el: 'Greek', tr: 'Turkish', sr: 'Serbian', mk: 'Macedonian', es: 'Spanish', pt: 'Portuguese', ro: 'Romanian', pl: 'Polish', nl: 'Dutch', ru: 'Russian', ar: 'Arabic' },
  fr: { sq: 'Albanais', de: 'Allemand', en: 'Anglais', fr: 'Français', it: 'Italien', el: 'Grec', tr: 'Turc', sr: 'Serbe', mk: 'Macédonien', es: 'Espagnol', pt: 'Portugais', ro: 'Roumain', pl: 'Polonais', nl: 'Néerlandais', ru: 'Russe', ar: 'Arabe' },
  it: { sq: 'Albanese', de: 'Tedesco', en: 'Inglese', fr: 'Francese', it: 'Italiano', el: 'Greco', tr: 'Turco', sr: 'Serbo', mk: 'Macedone', es: 'Spagnolo', pt: 'Portoghese', ro: 'Rumeno', pl: 'Polacco', nl: 'Olandese', ru: 'Russo', ar: 'Arabo' },
  sq: { sq: 'Shqip', de: 'Gjermanisht', en: 'Anglisht', fr: 'Frëngjisht', it: 'Italisht', el: 'Greqisht', tr: 'Turqisht', sr: 'Serbisht', mk: 'Maqedonisht', es: 'Spanjisht', pt: 'Portugalisht', ro: 'Rumanisht', pl: 'Polonisht', nl: 'Holandisht', ru: 'Rusisht', ar: 'Arabisht' },
};

interface BackendAd {
  id: string;
  userId: string;
  category: string;
  firstName: string;
  surname: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  experience: string | null;
  age: number | null;
  livingPlace: string | null;
  skills: string[];
  spokenLanguages: string[];
  status: string;
  views: number;
  createdAt: string;
  user?: { displayName: string | null };
}

type Candidate = {
  id: string;
  userId: string;
  firstName: string;
  photo: string;
  profession: string;
  experience: string;
  age: number | null;
  skills: string[];
  spokenLanguages: string[];
  location: string;
  phone: string;
  email: string;
};

function mapBackendAd(ad: BackendAd, locale: string = 'sq', categories: JobCategory[] = []): Candidate {
  return {
    id: ad.id,
    userId: ad.userId,
    firstName: ad.firstName,
    photo: ad.photoUrl
      ? (ad.photoUrl.startsWith('http') ? ad.photoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${ad.photoUrl}`)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.firstName)}&background=162C66&color=fff&size=150`,
    profession: getTranslatedTitle(categories, ad.category, locale as Locale),
    experience: translateExperience(ad.experience || '', locale),
    skills: translateSkills(Array.isArray(ad.skills) ? ad.skills : [], locale),
    spokenLanguages: Array.isArray(ad.spokenLanguages) ? ad.spokenLanguages : [],
    location: translateLocation(shortLocation(ad.livingPlace), locale),
    phone: ad.phone,
    email: ad.email || '',
    age: ad.age ?? null,
  };
}

const SidebarCollapsible = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between mb-3 text-left group">
        <span className="text-[15px] font-bold text-[#0B1F44]">{title}</span>
        <ChevronDown size={15} className={clsx('text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <div>{children}</div>}
    </>
  );
};

const loc = {
  de: {
    title: 'Kandidaten suchen', subtitle: 'Finden Sie den richtigen Kandidaten für Ihr Stellenangebot',
    searchPh: 'Name oder Beruf suchen...', locationPh: 'Standort...',
    found: (n: number, loc?: string) => loc ? `${n} Kandidaten in ${loc}` : `${n} Kandidaten gefunden`,
    noCandidates: 'Keine Kandidaten gefunden', noCandidatesHint: 'Versuchen Sie, Ihre Suchfilter anzupassen',
    experience: 'Erfahrung', skills: 'Fähigkeiten', languages: 'Sprachen', showMore: 'Mehr anzeigen',
    contact: (name: string) => `${name} kontaktieren`, contactSent: 'Kontaktanfrage gesendet!',
    addFavorite: 'Zu Favoriten hinzufügen', saved: 'Gespeichert', shareWith: 'Mit einem Freund teilen',
    sharedWa: 'Über WhatsApp geteilt!', sharedFb: 'Auf Facebook geteilt!', linkCopied: 'Link kopiert!',
    category: 'Beruf', resetFilters: 'Filter zurücksetzen',
  },
  en: {
    title: 'Search Candidates', subtitle: 'Find the right candidate for your job offer',
    searchPh: 'Search by name or profession...', locationPh: 'Location...',
    found: (n: number, loc?: string) => loc ? `${n} candidates in ${loc}` : `${n} candidates found`,
    noCandidates: 'No candidates found', noCandidatesHint: 'Try adjusting your search filters',
    experience: 'Experience', skills: 'Skills', languages: 'Languages', showMore: 'Show more',
    contact: (name: string) => `Contact ${name}`, contactSent: 'Contact request sent!',
    addFavorite: 'Add to favorites', saved: 'Saved', shareWith: 'Share with a friend',
    sharedWa: 'Shared via WhatsApp!', sharedFb: 'Shared on Facebook!', linkCopied: 'Link copied!',
    category: 'Profession', resetFilters: 'Reset filters',
  },
  fr: {
    title: 'Rechercher des candidats', subtitle: 'Trouvez le bon candidat pour votre offre d\'emploi',
    searchPh: 'Rechercher par nom ou profession...', locationPh: 'Lieu...',
    found: (n: number, loc?: string) => loc ? `${n} candidats à ${loc}` : `${n} candidats trouvés`,
    noCandidates: 'Aucun candidat trouvé', noCandidatesHint: 'Essayez d\'ajuster vos filtres de recherche',
    experience: 'Expérience', skills: 'Compétences', languages: 'Langues', showMore: 'Voir plus',
    contact: (name: string) => `Contacter ${name}`, contactSent: 'Demande de contact envoyée !',
    addFavorite: 'Ajouter aux favoris', saved: 'Enregistré', shareWith: 'Partager avec un ami',
    sharedWa: 'Partagé via WhatsApp !', sharedFb: 'Partagé sur Facebook !', linkCopied: 'Lien copié !',
    category: 'Profession', resetFilters: 'Réinitialiser',
  },
  it: {
    title: 'Cerca candidati', subtitle: 'Trova il candidato giusto per la tua offerta di lavoro',
    searchPh: 'Cerca per nome o professione...', locationPh: 'Luogo...',
    found: (n: number, loc?: string) => loc ? `${n} candidati a ${loc}` : `${n} candidati trovati`,
    noCandidates: 'Nessun candidato trovato', noCandidatesHint: 'Prova a modificare i filtri di ricerca',
    experience: 'Esperienza', skills: 'Competenze', languages: 'Lingue', showMore: 'Mostra di più',
    contact: (name: string) => `Contatta ${name}`, contactSent: 'Richiesta di contatto inviata!',
    addFavorite: 'Aggiungi ai preferiti', saved: 'Salvato', shareWith: 'Condividi con un amico',
    sharedWa: 'Condiviso via WhatsApp!', sharedFb: 'Condiviso su Facebook!', linkCopied: 'Link copiato!',
    category: 'Professione', resetFilters: 'Reimposta',
  },
  sq: {
    title: 'Kërko kandidatë', subtitle: 'Gjeni kandidatin e duhur për ofertën tuaj të punës',
    searchPh: 'Kërkoni sipas emrit ose profesionit...', locationPh: 'Vendndodhja...',
    found: (n: number, loc?: string) => loc ? `${n} kandidatë në ${loc}` : `${n} kandidatë të gjetur`,
    noCandidates: 'Asnjë kandidat nuk u gjet', noCandidatesHint: 'Provoni të rregulloni filtrat e kërkimit',
    experience: 'Përvoja', skills: 'Aftësitë', languages: 'Gjuhët', showMore: 'Shfaq më shumë',
    contact: (name: string) => `Kontaktoni ${name}`, contactSent: 'Kërkesa për kontakt u dërgua!',
    addFavorite: 'Shto në preferenca', saved: 'Ruajtur', shareWith: 'Ndaj me një mik',
    sharedWa: 'Ndarë përmes WhatsApp!', sharedFb: 'Ndarë në Facebook!', linkCopied: 'Linku u kopjua!',
    category: 'Profesioni', resetFilters: 'Rivendos filtrat',
  },
} as const;

export default function CandidatesPage() {
  const locale = useLocale() as keyof typeof loc;
  const t = loc[locale] ?? loc.de;
  const searchParams = useSearchParams();
  const { categories } = useCategories();

  const [keywordFilter, setKeywordFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchLat, setSearchLat] = useState<number | null>(null);
  const [searchLng, setSearchLng] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [searchRadius, setSearchRadius] = useState(100);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'relevance'>('relevance');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [initialReady, setInitialReady] = useState(false);
  const [page, setPage] = useState(1);
  const { isFavorited, toggleFavorite: toggleFav, trackShare } = useFavorites();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Scroll restoration: save/restore state when navigating away and back
  const SCROLL_CACHE_KEY = 'candidates_scroll_cache';
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SCROLL_CACHE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(SCROLL_CACHE_KEY);
      const cache = JSON.parse(raw);
      if (Date.now() - cache.timestamp > 30 * 60 * 1000) return;
      // Only restore if the URL's location filter matches what was cached —
      // otherwise the cached total/candidates are stale for the new filter state.
      const urlLocation = searchParams.get('location') || '';
      if ((cache.locationFilter || '') !== urlLocation) return;
      skipNextFetchRef.current = true;
      setCandidates(cache.candidates);
      setPage(cache.page);
      setTotal(cache.total);
      setTotalPages(cache.totalPages);
      if (cache.locationFilter) setLocationFilter(cache.locationFilter);
      if (Array.isArray(cache.categoryFilter)) setCategoryFilter(cache.categoryFilter);
      if (Array.isArray(cache.experienceFilter)) setExperienceFilter(cache.experienceFilter);
      if (Array.isArray(cache.availabilityFilter)) setAvailabilityFilter(cache.availabilityFilter);
      setLoading(false);
      setInitialReady(true);
      requestAnimationFrame(() => {
        setTimeout(() => window.scrollTo(0, cache.scrollY), 50);
      });
    } catch {}
  }, []);

  const saveScrollState = () => {
    try {
      sessionStorage.setItem(SCROLL_CACHE_KEY, JSON.stringify({
        candidates, page, total, totalPages,
        locationFilter, categoryFilter, experienceFilter, availabilityFilter,
        scrollY: window.scrollY, timestamp: Date.now()
      }));
    } catch {}
  };

  // Mobile category autocomplete
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const mobileCatRef = useRef<HTMLDivElement>(null);

  const mobileCatSuggestions = useMemo(() => {
    const q = keywordFilter.toLowerCase().trim();
    if (!q || q.length < 1) return [];
    const results: { key: string; label: string; groupLabel: string; groupIcon: string }[] = [];
    for (const group of categories) {
      for (const title of group.titles) {
        const label = title.labels[(locale as Locale)] || title.labels.sq;
        if (label.toLowerCase().includes(q) || title.key.toLowerCase().includes(q)) {
          results.push({ key: title.key, label, groupLabel: group.labels[(locale as Locale)] || group.labels.sq, groupIcon: group.icon });
        }
      }
    }
    return results.slice(0, 8);
  }, [keywordFilter, categories, locale]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileCatRef.current && !mobileCatRef.current.contains(e.target as Node)) setMobileCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openCandidateDetail = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    const token = getToken() || undefined;
    api.get<{ ok: boolean }>(`/api/ads/${candidate.id}`, token)
      .catch(() => {});
  };

  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc) setLocationFilter(loc);
  }, [searchParams]);

  // All categories from shared package, filtered by search
  const filteredCategoryGroups = useMemo(() => {
    const q = categorySearch.toLowerCase().trim();
    return categories.map((group) => {
      const filteredTitles = q
        ? group.titles.filter((t) => {
            const label = t.labels[(locale as Locale)] || t.labels.sq;
            return label.toLowerCase().includes(q) || t.key.toLowerCase().includes(q);
          })
        : group.titles;
      return { ...group, titles: filteredTitles };
    }).filter((g) => g.titles.length > 0);
  }, [categories, categorySearch, locale]);

  // Fetch candidates from backend
  const fetchCandidates = useCallback(() => {
    setLoading(true);
    const qp = new URLSearchParams();
    qp.set('page', String(page));
    qp.set('limit', String(CANDIDATES_PER_PAGE));
    if (keywordFilter.trim()) qp.set('keyword', keywordFilter.trim());
    if (locationFilter.trim()) {
      qp.set('location', locationFilter.trim());
    }
    if (searchLat != null && searchLng != null) {
      qp.set('lat', String(searchLat));
      qp.set('lng', String(searchLng));
      qp.set('radius', String(searchRadius));
    }
    if (categoryFilter.length) qp.set('category', categoryFilter.join(','));
    if (experienceFilter.length) qp.set('experience', experienceFilter.join(','));
    if (availabilityFilter.length) qp.set('availability', availabilityFilter.join(','));
    if (sortBy) qp.set('sort', sortBy);
    api.get<{ ok: boolean; ads: BackendAd[]; total: number; totalPages: number }>(`/api/ads?${qp}`)
      .then((res) => {
        if (res.ok && res.ads) {
          setCandidates(res.ads.map((ad) => mapBackendAd(ad, locale, categories)));
          setTotal(res.total);
          setTotalPages(res.totalPages);
        } else {
          console.error('[Candidates] API response not ok:', res);
        }
      })
      .catch((err) => { console.error('[Candidates] Fetch error:', err); })
      .finally(() => { setLoading(false); setInitialReady(true); });
  }, [page, keywordFilter, locationFilter, searchLat, searchLng, searchRadius, categoryFilter, experienceFilter, availabilityFilter, sortBy, categories, locale]);

  useEffect(() => {
    if (skipNextFetchRef.current) { skipNextFetchRef.current = false; return; }
    fetchCandidates();
  }, [fetchCandidates]);

  // Auto-open detail modal when ?id= param is present (shared link)
  useEffect(() => {
    const sharedId = searchParams.get('id');
    if (!sharedId) return;
    const token = getToken() || undefined;
    api.get<{ ok: boolean; ad: BackendAd }>(`/api/ads/${sharedId}`, token)
      .then((res) => { if (res.ok) setSelectedCandidate(mapBackendAd(res.ad, locale, categories)); })
      .catch(() => {});
  }, [searchParams, locale, categories]);

  const toggleFavorite = (id: string) => { toggleFav('ad', id); };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locationFilter.trim() && searchLat == null && searchLng == null) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationFilter.trim())}&format=json&limit=1`);
        const data = await res.json();
        if (data.length > 0) {
          setSearchLat(parseFloat(data[0].lat));
          setSearchLng(parseFloat(data[0].lon));
        }
      } catch { /* fallback to text search */ }
    }
    setPage(1);
  };

  const handleClearAll = () => {
    setKeywordFilter('');
    setLocationFilter('');
    setSearchLat(null);
    setSearchLng(null);
    setCategoryFilter([]);
    setExperienceFilter([]);
    setAvailabilityFilter([]);
    setSearchRadius(60);
    setSortBy('relevance');
    setPage(1);
  };

  // Don't render anything until initial data is ready — prevents count flickering
  if (!initialReady) {
    return <SkeletonList count={3} />;
  }

  const hasActiveFilters = categoryFilter.length > 0 || locationFilter.trim() !== '' || experienceFilter.length > 0 || availabilityFilter.length > 0;

  // Shared sidebar filter content (used in desktop sidebar + mobile sheet)
  const categoryFilterContent = (
    <>
      <div className="mb-6">
        <span className="text-[15px] font-bold text-[#0B1F44] mb-3 block">{t.category}</span>
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder={locale === 'de' ? 'Suchen...' : locale === 'fr' ? 'Rechercher...' : locale === 'it' ? 'Cerca...' : locale === 'sq' ? 'Kërko...' : 'Search...'}
            className="w-full pl-8 pr-3 py-2 text-[12px] font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#162C66]/20 focus:border-[#162C66]/30 outline-none transition-all"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {filteredCategoryGroups.length > 0 ? filteredCategoryGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.slug) || categorySearch.length > 0;
            const visibleTitles = isExpanded ? group.titles : [];
            const selectedInGroup = group.titles.filter((ti) => categoryFilter.includes(ti.key)).length;
            return (
              <div key={group.slug} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedGroups((prev) => prev.includes(group.slug) ? prev.filter((s) => s !== group.slug) : [...prev, group.slug])}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg bg-[#F5C400]/10 hover:bg-[#F5C400]/20 transition-colors"
                >
                  <span className="text-sm">{group.icon}</span>
                  <span className="text-[13px] font-bold text-[#162C66] flex-1 text-left leading-snug">{group.labels[(locale as Locale)] || group.labels.sq}</span>
                  {selectedInGroup > 0 && <span className="w-4 h-4 rounded-full bg-[#162C66] text-white text-[9px] font-bold flex items-center justify-center">{selectedInGroup}</span>}
                  <ChevronDown size={12} className={clsx('text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                </button>
                {visibleTitles.length > 0 && (
                  <div className="ml-5 space-y-0.5 mt-0.5">
                    {visibleTitles.map((title) => (
                      <label key={title.key} className="flex items-center gap-2.5 px-2 py-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={categoryFilter.includes(title.key)}
                            onChange={() => {
                              const next = categoryFilter.includes(title.key) ? categoryFilter.filter((c) => c !== title.key) : [...categoryFilter, title.key];
                              setCategoryFilter(next);
                              setPage(1);
                            }}
                            className="peer appearance-none w-3.5 h-3.5 border-[1.5px] border-slate-300 rounded checked:bg-[#162C66] checked:border-[#162C66] transition-all"
                          />
                          <Check size={9} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                        <span className="text-[12px] font-medium text-slate-600 leading-tight">{title.labels[(locale as Locale)] || title.labels.sq}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <p className="text-[12px] text-slate-400 font-medium italic px-2 py-2">
              {locale === 'de' ? 'Keine Ergebnisse' : locale === 'fr' ? 'Aucun résultat' : locale === 'it' ? 'Nessun risultato' : locale === 'sq' ? 'Asnjë rezultat' : 'No results'}
            </p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <FeedbackToast message={toast} onDismiss={() => setToast(null)} />

      {/* Mobile Filter Sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[320px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-extrabold text-[#0B1F44]">
                  {locale === 'de' ? 'Filtern' : locale === 'fr' ? 'Filtrer' : locale === 'it' ? 'Filtra' : locale === 'sq' ? 'Filtro' : 'Filter'}
                </h3>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button onClick={handleClearAll} className="text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors">
                      {t.resetFilters}
                    </button>
                  )}
                  <button onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* Profession filter (top) */}
              {categoryFilterContent}

              {/* Location */}
              <div className="mb-6">
                <span className="text-[15px] font-bold text-[#0B1F44] mb-3 block">
                  {locale === 'de' ? 'Stadt oder Region' : locale === 'fr' ? 'Ville ou région' : locale === 'it' ? 'Città o regione' : locale === 'sq' ? 'Qyteti ose rajoni' : 'City or Region'}
                </span>
                <LocationAutocomplete
                  value={locationFilter}
                  onChange={(val) => { setLocationFilter(val); setSearchLat(null); setSearchLng(null); }}
                  onSelect={(s: LocationSuggestion) => { setLocationFilter(shortSuggestionLabel(s)); setSearchLat(s.lat); setSearchLng(s.lng); }}
                  placeholder={locale === 'de' ? 'Stadt oder Region' : locale === 'fr' ? 'Ville ou région' : locale === 'it' ? 'Città o regione' : locale === 'sq' ? 'Qyteti ose rajoni' : 'City or State'}
                  iconSize={16}
                  iconClassName="text-amber-500 left-3"
                  inputClassName="w-full pl-9 pr-8 py-2.5 text-[13px] font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#162C66]/20 focus:border-[#162C66]/30 outline-none transition-all"
                />
              </div>
              {/* Max distance slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[15px] font-bold text-[#0B1F44]">
                    {locale === 'de' ? 'Max. Entfernung' : locale === 'fr' ? 'Distance max.' : locale === 'it' ? 'Distanza max.' : locale === 'sq' ? 'Distanca maks.' : 'Max. Distance'}
                  </span>
                  <span className="text-[14px] font-semibold text-slate-500">{searchRadius} km</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#162C66]"
                />
              </div>

              {/* Sortierung - collapsed */}
              <div className="mb-6">
                <SidebarCollapsible
                  title={locale === 'de' ? 'Sortierung' : locale === 'fr' ? 'Tri' : locale === 'it' ? 'Ordinamento' : locale === 'sq' ? 'Renditja' : 'Sort'}
                  defaultOpen={false}
                >
                  <div className="space-y-1">
                    {([
                      { key: 'newest' as const, de: 'Neueste zuerst', en: 'Newest first', fr: 'Plus récents', it: 'Più recenti', sq: 'Më të rejat' },
                      { key: 'oldest' as const, de: 'Älteste zuerst', en: 'Oldest first', fr: 'Plus anciens', it: 'Più vecchi', sq: 'Më të vjetrat' },
                      { key: 'relevance' as const, de: 'Relevanz', en: 'Relevance', fr: 'Pertinence', it: 'Rilevanza', sq: 'Relevanca' },
                    ]).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => { setSortBy(opt.key); setPage(1); }}
                        className={clsx(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                          sortBy === opt.key
                            ? 'bg-[#162C66]/[0.06] text-[#162C66] font-semibold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        )}
                      >
                        {opt[locale] || opt.en}
                        {sortBy === opt.key && <Check size={14} className="text-[#162C66]" />}
                      </button>
                    ))}
                  </div>
                </SidebarCollapsible>
              </div>

              {/* Erfahrung - collapsed */}
              <div className="mb-6">
                <SidebarCollapsible
                  title={locale === 'de' ? 'Erfahrung' : locale === 'fr' ? 'Expérience' : locale === 'it' ? 'Esperienza' : locale === 'sq' ? 'Përvoja' : 'Experience'}
                  defaultOpen={false}
                >
                  <div className="space-y-1.5">
                    {([
                      { key: 'entry', de: 'Berufseinsteiger', en: 'Entry level', fr: 'Débutant', it: 'Principiante', sq: 'Fillestar' },
                      { key: 'junior', de: '1–3 Jahre', en: '1–3 years', fr: '1–3 ans', it: '1–3 anni', sq: '1–3 vite' },
                      { key: 'mid', de: '3–5 Jahre', en: '3–5 years', fr: '3–5 ans', it: '3–5 anni', sq: '3–5 vite' },
                      { key: 'senior', de: '5+ Jahre', en: '5+ years', fr: '5+ ans', it: '5+ anni', sq: '5+ vite' },
                    ]).map((opt) => (
                      <label key={opt.key} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" className="peer appearance-none w-4 h-4 border-[1.5px] border-slate-300 rounded checked:bg-[#162C66] checked:border-[#162C66] transition-all" />
                          <Check size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                        <span className="text-[13px] font-medium text-slate-700">{opt[locale] || opt.en}</span>
                      </label>
                    ))}
                  </div>
                </SidebarCollapsible>
              </div>

              {/* Verfügbarkeit - collapsed */}
              <div className="mb-6">
                <SidebarCollapsible
                  title={locale === 'de' ? 'Verfügbarkeit' : locale === 'fr' ? 'Disponibilité' : locale === 'it' ? 'Disponibilità' : locale === 'sq' ? 'Disponueshmëria' : 'Availability'}
                  defaultOpen={false}
                >
                  <div className="space-y-1.5">
                    {([
                      { key: 'immediate', de: 'Sofort verfügbar', en: 'Immediately available', fr: 'Disponible immédiatement', it: 'Disponibile subito', sq: 'Menjëherë i disponueshëm' },
                      { key: 'negotiable', de: 'Nach Vereinbarung', en: 'Negotiable', fr: 'Négociable', it: 'Da concordare', sq: 'Me marrëveshje' },
                    ]).map((opt) => (
                      <label key={opt.key} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="relative flex items-center justify-center">
                          <input type="checkbox" className="peer appearance-none w-4 h-4 border-[1.5px] border-slate-300 rounded checked:bg-[#162C66] checked:border-[#162C66] transition-all" />
                          <Check size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                        <span className="text-[13px] font-medium text-slate-700">{opt[locale] || opt.en}</span>
                      </label>
                    ))}
                  </div>
                </SidebarCollapsible>
              </div>

              <button
                type="button"
                onClick={() => { setPage(1); setMobileFiltersOpen(false); }}
                className="w-full py-3 bg-[#162C66] text-white text-[14px] font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-md shadow-[#162C66]/15"
              >
                {locale === 'de' ? 'Suchen' : locale === 'fr' ? 'Chercher' : locale === 'it' ? 'Cerca' : locale === 'sq' ? 'Kërko' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Bar - Keyword + Location always visible on mobile */}
      <div className="lg:hidden bg-[#162C66] rounded-2xl px-4 pt-4 pb-5 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-2.5">
          <div className="relative" ref={mobileCatRef}>
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none z-10" />
            <input
              type="text"
              value={keywordFilter}
              onChange={(e) => { setKeywordFilter(e.target.value); setMobileCatOpen(true); }}
              onFocus={() => { if (keywordFilter.trim()) setMobileCatOpen(true); }}
              placeholder={locale === 'de' ? 'Berufsbezeichnung, Name...' : locale === 'fr' ? 'Profession, nom...' : locale === 'it' ? 'Professione, nome...' : locale === 'sq' ? 'Profesioni, emri...' : 'Profession, name...'}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-[14px] font-medium placeholder:text-white/40 focus:bg-white/15 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all"
            />
            {mobileCatOpen && mobileCatSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 max-h-64 overflow-y-auto">
                {mobileCatSuggestions.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); }}
                    onClick={() => {
                      setCategoryFilter(prev => prev.includes(s.key) ? prev : [...prev, s.key]);
                      setKeywordFilter('');
                      setMobileCatOpen(false);
                      setPage(1);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <span className="text-base">{s.groupIcon}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0B1F44] truncate">{s.label}</p>
                      <p className="text-[11px] text-slate-400 truncate">{s.groupLabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <LocationAutocomplete
              value={locationFilter}
              onChange={(val) => { setLocationFilter(val); setSearchLat(null); setSearchLng(null); }}
              onSelect={(s: LocationSuggestion) => { setLocationFilter(shortSuggestionLabel(s)); setSearchLat(s.lat); setSearchLng(s.lng); }}
              placeholder={locale === 'de' ? 'Arbeitsort, Kanton...' : locale === 'fr' ? 'Lieu, canton...' : locale === 'it' ? 'Luogo, cantone...' : locale === 'sq' ? 'Vendi, rajoni...' : 'Location, region...'}
              iconSize={16}
              iconClassName="text-[#F5C400] left-3.5"
              inputClassName="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-[14px] font-medium placeholder:text-white/40 focus:bg-white/15 focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none transition-all"
              className=""
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#F5C400] text-[#0B1A3B] rounded-xl text-[14px] font-bold hover:bg-[#FFD633] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#F5C400]/20"
          >
            <Search size={16} />
            {locale === 'de' ? 'Suchen' : locale === 'fr' ? 'Chercher' : locale === 'it' ? 'Cerca' : locale === 'sq' ? 'Kërko' : 'Search'}
          </button>
        </form>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mr-1">
            {locale === 'de' ? 'Filter' : locale === 'fr' ? 'Filtres' : locale === 'it' ? 'Filtri' : locale === 'sq' ? 'Filtra' : 'Filters'}:
          </span>
          {locationFilter.trim() && (
            <button
              onClick={() => { setLocationFilter(''); setSearchLat(null); setSearchLng(null); setPage(1); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 text-[12px] font-semibold hover:bg-violet-100 transition-colors"
            >
              {locationFilter}
              <X size={12} />
            </button>
          )}
          {categoryFilter.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(categoryFilter.filter((c) => c !== cat)); setPage(1); }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[12px] font-semibold hover:bg-blue-100 transition-colors"
            >
              {getTranslatedTitle(categories, cat, locale as Locale)}
              <X size={12} />
            </button>
          ))}
          {experienceFilter.map(key => {
            const labels: Record<string, Record<string, string>> = {
              entry: { de: 'Berufseinsteiger', en: 'Entry level', fr: 'Débutant', it: 'Principiante', sq: 'Fillestar' },
              junior: { de: '1–3 Jahre', en: '1–3 years', fr: '1–3 ans', it: '1–3 anni', sq: '1–3 vite' },
              mid: { de: '3–5 Jahre', en: '3–5 years', fr: '3–5 ans', it: '3–5 anni', sq: '3–5 vite' },
              senior: { de: '5+ Jahre', en: '5+ years', fr: '5+ ans', it: '5+ anni', sq: '5+ vite' },
            };
            return (
              <button
                key={key}
                onClick={() => { setExperienceFilter(experienceFilter.filter((k) => k !== key)); setPage(1); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-semibold hover:bg-emerald-100 transition-colors"
              >
                {labels[key]?.[locale] || labels[key]?.en || key}
                <X size={12} />
              </button>
            );
          })}
          {availabilityFilter.map(key => {
            const labels: Record<string, Record<string, string>> = {
              immediate: { de: 'Sofort verfügbar', en: 'Immediately available', fr: 'Disponible immédiatement', it: 'Disponibile subito', sq: 'Menjëherë i disponueshëm' },
              negotiable: { de: 'Nach Vereinbarung', en: 'Negotiable', fr: 'Négociable', it: 'Da concordare', sq: 'Me marrëveshje' },
            };
            return (
              <button
                key={key}
                onClick={() => { setAvailabilityFilter(availabilityFilter.filter((k) => k !== key)); setPage(1); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[12px] font-semibold hover:bg-amber-100 transition-colors"
              >
                {labels[key]?.[locale] || labels[key]?.en || key}
                <X size={12} />
              </button>
            );
          })}
          <button
            onClick={handleClearAll}
            className="text-[12px] font-semibold text-red-500 hover:text-red-600 ml-2 transition-colors"
          >
            {t.resetFilters}
          </button>
        </div>
      )}

      {/* 2-Column Layout: Sidebar + Content */}
      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-[#0B1F44]">
                {locale === 'de' ? 'Filtern' : locale === 'fr' ? 'Filtrer' : locale === 'it' ? 'Filtra' : locale === 'sq' ? 'Filtro' : 'Filter'}
              </h3>
              {hasActiveFilters && (
                <button onClick={handleClearAll} className="text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors">
                  {t.resetFilters}
                </button>
              )}
            </div>

            {/* Profession filter (top) */}
            {categoryFilterContent}

            {/* Location input */}
            <div className="mb-6">
              <span className="text-[15px] font-bold text-[#0B1F44] mb-3 block">
                {locale === 'de' ? 'Stadt oder Region' : locale === 'fr' ? 'Ville ou région' : locale === 'it' ? 'Città o regione' : locale === 'sq' ? 'Qyteti ose rajoni' : 'City or Region'}
              </span>
              <LocationAutocomplete
                value={locationFilter}
                onChange={(val) => { setLocationFilter(val); setSearchLat(null); setSearchLng(null); }}
                onSelect={(s: LocationSuggestion) => { setLocationFilter(shortSuggestionLabel(s)); setSearchLat(s.lat); setSearchLng(s.lng); }}
                placeholder={locale === 'de' ? 'Stadt oder Region' : locale === 'fr' ? 'Ville ou région' : locale === 'it' ? 'Città o regione' : locale === 'sq' ? 'Qyteti ose rajoni' : 'City or State'}
                iconSize={16}
                iconClassName="text-amber-500 left-3"
                inputClassName="w-full pl-9 pr-8 py-2.5 text-[13px] font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#162C66]/20 focus:border-[#162C66]/30 outline-none transition-all"
              />
            </div>

            {/* Max distance slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] font-bold text-[#0B1F44]">
                  {locale === 'de' ? 'Max. Entfernung' : locale === 'fr' ? 'Distance max.' : locale === 'it' ? 'Distanza max.' : locale === 'sq' ? 'Distanca maks.' : 'Max. Distance'}
                </span>
                <span className="text-[14px] font-semibold text-slate-500">{searchRadius} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#162C66]"
              />
            </div>

            {/* Sortierung - collapsed */}
            <div className="mb-6 last:mb-0">
              <SidebarCollapsible
                title={locale === 'de' ? 'Sortierung' : locale === 'fr' ? 'Tri' : locale === 'it' ? 'Ordinamento' : locale === 'sq' ? 'Renditja' : 'Sort'}
                defaultOpen={false}
              >
                <div className="space-y-1">
                  {([
                    { key: 'newest' as const, de: 'Neueste zuerst', en: 'Newest first', fr: 'Plus récents', it: 'Più recenti', sq: 'Më të rejat' },
                    { key: 'oldest' as const, de: 'Älteste zuerst', en: 'Oldest first', fr: 'Plus anciens', it: 'Più vecchi', sq: 'Më të vjetrat' },
                    { key: 'relevance' as const, de: 'Relevanz', en: 'Relevance', fr: 'Pertinence', it: 'Rilevanza', sq: 'Relevanca' },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => { setSortBy(opt.key); setPage(1); }}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                        sortBy === opt.key
                          ? 'bg-[#162C66]/[0.06] text-[#162C66] font-semibold'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      )}
                    >
                      {opt[locale] || opt.en}
                      {sortBy === opt.key && <Check size={14} className="text-[#162C66]" />}
                    </button>
                  ))}
                </div>
              </SidebarCollapsible>
            </div>

            {/* Erfahrung - collapsed */}
            <div className="mb-6 last:mb-0">
              <SidebarCollapsible
                title={locale === 'de' ? 'Erfahrung' : locale === 'fr' ? 'Expérience' : locale === 'it' ? 'Esperienza' : locale === 'sq' ? 'Përvoja' : 'Experience'}
                defaultOpen={false}
              >
                <div className="space-y-1.5">
                  {([
                    { key: 'entry', de: 'Berufseinsteiger', en: 'Entry level', fr: 'Débutant', it: 'Principiante', sq: 'Fillestar' },
                    { key: 'junior', de: '1–3 Jahre', en: '1–3 years', fr: '1–3 ans', it: '1–3 anni', sq: '1–3 vite' },
                    { key: 'mid', de: '3–5 Jahre', en: '3–5 years', fr: '3–5 ans', it: '3–5 anni', sq: '3–5 vite' },
                    { key: 'senior', de: '5+ Jahre', en: '5+ years', fr: '5+ ans', it: '5+ anni', sq: '5+ vite' },
                  ]).map((opt) => (
                    <label key={opt.key} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={experienceFilter.includes(opt.key)}
                          onChange={() => {
                            setExperienceFilter(prev => prev.includes(opt.key) ? prev.filter(k => k !== opt.key) : [...prev, opt.key]);
                            setPage(1);
                          }}
                          className="peer appearance-none w-4 h-4 border-[1.5px] border-slate-300 rounded checked:bg-[#162C66] checked:border-[#162C66] transition-all"
                        />
                        <Check size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-[13px] font-medium text-slate-700">{opt[locale] || opt.en}</span>
                    </label>
                  ))}
                </div>
              </SidebarCollapsible>
            </div>

            {/* Verfügbarkeit - collapsed */}
            <div className="mb-6 last:mb-0">
              <SidebarCollapsible
                title={locale === 'de' ? 'Verfügbarkeit' : locale === 'fr' ? 'Disponibilité' : locale === 'it' ? 'Disponibilità' : locale === 'sq' ? 'Disponueshmëria' : 'Availability'}
                defaultOpen={false}
              >
                <div className="space-y-1.5">
                  {([
                    { key: 'immediate', de: 'Sofort verfügbar', en: 'Immediately available', fr: 'Disponible immédiatement', it: 'Disponibile subito', sq: 'Menjëherë i disponueshëm' },
                    { key: 'negotiable', de: 'Nach Vereinbarung', en: 'Negotiable', fr: 'Négociable', it: 'Da concordare', sq: 'Me marrëveshje' },
                  ]).map((opt) => (
                    <label key={opt.key} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={availabilityFilter.includes(opt.key)}
                          onChange={() => {
                            setAvailabilityFilter(prev => prev.includes(opt.key) ? prev.filter(k => k !== opt.key) : [...prev, opt.key]);
                            setPage(1);
                          }}
                          className="peer appearance-none w-4 h-4 border-[1.5px] border-slate-300 rounded checked:bg-[#162C66] checked:border-[#162C66] transition-all"
                        />
                        <Check size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-[13px] font-medium text-slate-700">{opt[locale] || opt.en}</span>
                    </label>
                  ))}
                </div>
              </SidebarCollapsible>
            </div>

            {/* Search button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                className="w-full py-3 bg-[#162C66] text-white text-[14px] font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-md shadow-[#162C66]/15"
              >
                {locale === 'de' ? 'Suchen' : locale === 'fr' ? 'Chercher' : locale === 'it' ? 'Cerca' : locale === 'sq' ? 'Kërko' : 'Search'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Results header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F44] tracking-tight mb-1">
              {t.found(total, locationFilter.trim() || undefined)}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] font-medium text-slate-500">{t.subtitle}</p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                >
                  <SlidersHorizontal size={15} />
                  <span>Filter</span>
                  {hasActiveFilters && (
                    <span className="w-5 h-5 bg-[#162C66] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {categoryFilter.length + (locationFilter.trim() ? 1 : 0)}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={() => { setSortBy('relevance'); setPage(1); }}
                    className={clsx(
                      'px-2.5 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-[12px] font-semibold transition-all flex items-center gap-1.5',
                      sortBy === 'relevance'
                        ? 'bg-[#162C66] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <Sparkles size={12} />
                    {locale === 'de' ? 'Relevanz' : locale === 'fr' ? 'Pertinence' : locale === 'it' ? 'Rilevanza' : locale === 'sq' ? 'Relevanca' : 'Relevance'}
                  </button>
                  <button
                    onClick={() => { setSortBy('newest'); setPage(1); }}
                    className={clsx(
                      'px-2.5 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-[12px] font-semibold transition-all flex items-center gap-1.5',
                      (sortBy === 'newest' || sortBy === 'oldest')
                        ? 'bg-[#162C66] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    <CalendarDays size={12} />
                    {locale === 'de' ? 'Datum' : locale === 'fr' ? 'Date' : locale === 'it' ? 'Data' : locale === 'sq' ? 'Data' : 'Date'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <SkeletonList count={3} />
          ) : candidates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Search size={28} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F44] mb-2">{t.noCandidates}</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">{t.noCandidatesHint}</p>
              <button onClick={handleClearAll} className="px-5 py-2.5 bg-[#162C66] text-white rounded-lg text-sm font-semibold hover:bg-[#0F1E45] transition-all">
                {t.resetFilters}
              </button>
            </div>
          ) : (
            <>
              {/* Profile Cards */}
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => openCandidateDetail(candidate)}
                    className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all overflow-hidden cursor-pointer"
                  >
                    <div className="p-5 sm:p-6">
                      {/* Row 1: Photo + Info + Actions */}
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={candidate.photo}
                          alt={candidate.firstName}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1F44] leading-snug">{candidate.profession}</h3>
                              <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <User size={14} className="text-slate-400" />{candidate.firstName}{candidate.age ? `, ${candidate.age}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(candidate.id); }}
                                className={clsx(
                                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                                  isFavorited('ad', candidate.id)
                                    ? 'bg-rose-100 text-rose-500 border border-rose-200'
                                    : 'bg-rose-50/80 text-rose-400 border border-rose-100/80 hover:text-rose-500 hover:bg-rose-100'
                                )}
                              >
                                <Heart size={16} fill={isFavorited('ad', candidate.id) ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setShowShareMenu(showShareMenu === candidate.id ? null : candidate.id); }}
                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50/80 text-blue-500 border border-blue-100/80 hover:text-blue-600 hover:bg-blue-100 transition-all"
                              >
                                <Share2 size={16} />
                              </button>
                            </div>
                          </div>
                          {candidate.experience && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg text-emerald-700 text-[13px] font-bold border border-emerald-100">
                              <Award size={13} className="text-emerald-500" />
                              {candidate.experience} {t.experience}
                            </span>
                          )}

                          {/* Spoken languages */}
                          {candidate.spokenLanguages.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                                <Globe size={12} className="text-sky-600" />
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {candidate.spokenLanguages.map((lang) => (
                                  <span
                                    key={lang}
                                    title={LANG_NAMES[locale]?.[lang] || lang}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-[11px] sm:text-[12px] font-medium text-slate-600 rounded-md"
                                  >
                                    <span className="text-[13px] leading-none">{LANG_FLAGS[lang] || '🌐'}</span>
                                    <span className="hidden sm:inline">{LANG_NAMES[locale]?.[lang] || lang}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Share dropdown inline */}
                      {showShareMenu === candidate.id && (
                        <div className="mb-4 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white text-[12px] font-semibold text-slate-600 transition-colors" onClick={() => { const url = buildShareUrl('ad', candidate.id); shareWhatsApp(url); trackShare('ad', candidate.id); setShowShareMenu(null); setToast(t.sharedWa); }}>
                            <FaWhatsapp color="#25D366" size={15} /> WhatsApp
                          </button>
                          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white text-[12px] font-semibold text-slate-600 transition-colors" onClick={() => { const url = buildShareUrl('ad', candidate.id); shareFacebook(url); trackShare('ad', candidate.id); setShowShareMenu(null); setToast(t.sharedFb); }}>
                            <FaFacebook color="#1877F2" size={15} /> Facebook
                          </button>
                          <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white text-[12px] font-semibold text-slate-600 transition-colors" onClick={() => { const url = buildShareUrl('ad', candidate.id); copyLink(url); trackShare('ad', candidate.id); setShowShareMenu(null); setToast(t.linkCopied); }}>
                            <Copy size={14} className="text-slate-400" /> Link
                          </button>
                        </div>
                      )}

                      {/* Row 2: Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {candidate.location && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/50 text-amber-600 text-[12px] sm:text-[13px] font-bold rounded-lg border border-amber-200/60">
                            <MapPin size={13} className="text-amber-500" />{candidate.location}
                          </span>
                        )}
                        {candidate.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-violet-700 text-[12px] sm:text-[13px] font-bold rounded-lg border border-violet-100">
                            <Sparkles size={11} className="text-violet-400" />{skill}
                          </span>
                        ))}
                      </div>

                      {/* Row 3: Show more */}
                      <button
                        type="button"
                        onClick={() => openCandidateDetail(candidate)}
                        className="group/btn inline-flex items-center gap-2 px-5 py-2 bg-slate-50/80 text-[#0B1F44] text-[13px] font-bold rounded-xl hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all"
                      >
                        <Eye size={15} className="text-[#0B1F44] group-hover/btn:text-blue-600 transition-colors" />
                        {t.showMore}
                        <ArrowRight size={14} className="text-[#0B1F44] group-hover/btn:text-blue-600 transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`dots-${idx}`} className="px-1 text-slate-400 text-[13px]">...</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setPage(item as number)}
                          className={clsx(
                            'w-9 h-9 rounded-lg text-[13px] font-semibold transition-all',
                            page === item
                              ? 'bg-[#162C66] text-white shadow-sm'
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          {item}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setSelectedCandidate(null); setShowShareMenu(null); }}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-6 pb-4">
              <button
                type="button"
                onClick={() => { setSelectedCandidate(null); setShowShareMenu(null); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 mb-5">
                <img
                  src={selectedCandidate.photo}
                  alt={selectedCandidate.firstName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100"
                />
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B1F44]">{selectedCandidate.firstName}</h2>
                  <p className="text-sm font-semibold text-slate-500">{selectedCandidate.profession}</p>
                  {selectedCandidate.location && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span className="text-[13px] font-medium text-slate-500">{selectedCandidate.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedCandidate.experience && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-4 py-2 bg-emerald-50 rounded-xl">
                    <span className="text-emerald-700 text-lg font-extrabold">{selectedCandidate.experience}</span>
                    <span className="text-emerald-600 text-sm font-bold ml-2">{t.experience}</span>
                  </div>
                </div>
              )}

              {selectedCandidate.spokenLanguages.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.languages}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.spokenLanguages.map((lang) => (
                      <span key={lang} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 text-[13px] font-semibold rounded-lg border border-sky-100">
                        {LANG_FLAGS[lang] || '🌐'} {LANG_NAMES[locale]?.[lang] || lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.skills.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.skills}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 bg-[#162C66]/[0.06] text-[#162C66] text-[13px] font-semibold rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-6 pt-4 space-y-3">
              <Button
                type="button"
                variant="primary"
                className="w-full justify-center h-12 rounded-xl font-bold gap-2"
                onClick={async () => {
                  try {
                    const { getToken } = await import('@/lib/auth');
                    const token = getToken();
                    if (!token) return;
                    saveScrollState();
                    const res = await api.post<{ ok: boolean; conversation: { id: string } }>('/api/messages/conversations', { targetUserId: selectedCandidate.userId }, token);
                    setSelectedCandidate(null); setShowShareMenu(null);
                    window.location.href = `/${locale}/dashboard/employer/messages?conv=${res.conversation.id}`;
                  } catch { setToast(t.contactSent); setTimeout(() => setToast(null), 3000); }
                }}
              >
                <MessageSquare size={18} />
                {t.contact(selectedCandidate.firstName)}
              </Button>

              <button
                type="button"
                onClick={() => { toggleFavorite(selectedCandidate.id); }}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold border transition-all',
                  isFavorited('ad', selectedCandidate.id)
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}
              >
                <Heart size={16} fill={isFavorited('ad', selectedCandidate.id) ? 'currentColor' : 'none'} />
                {isFavorited('ad', selectedCandidate.id) ? t.saved : t.addFavorite}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShareMenu(showShareMenu === selectedCandidate.id ? null : selectedCandidate.id)}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Share2 size={16} />
                  {t.shareWith}
                </button>
                {showShareMenu === selectedCandidate.id && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-10">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedCandidate) { const url = buildShareUrl('ad', selectedCandidate.id); shareWhatsApp(url); trackShare('ad', selectedCandidate.id); } setShowShareMenu(null); setToast(t.sharedWa); }}
                    >
                      <FaWhatsapp color="#25D366" size={16} /> WhatsApp
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedCandidate) { const url = buildShareUrl('ad', selectedCandidate.id); shareFacebook(url); trackShare('ad', selectedCandidate.id); } setShowShareMenu(null); setToast(t.sharedFb); }}
                    >
                      <FaFacebook color="#1877F2" size={16} /> Facebook
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedCandidate) { const url = buildShareUrl('ad', selectedCandidate.id); copyLink(url); trackShare('ad', selectedCandidate.id); } setShowShareMenu(null); setToast(t.linkCopied); }}
                    >
                      <Copy size={16} className="text-slate-500" /> Copy link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
