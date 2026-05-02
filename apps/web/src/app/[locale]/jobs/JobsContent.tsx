'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import { api } from '@/lib/api';
import {
  parseJobSearchParams,
  buildJobsSearchPath,
  type JobSearchParams
} from '@/lib/jobSearchParams';
import { getJobSeekerConfig } from '@/lib/siteConfig';
import { getToken, getSession } from '@/lib/auth';
import { currencyFromCountryCode } from '@/lib/currency';
import { jobLocation, shortSuggestionLabel } from '@/lib/location';
import { Link } from '@/i18n/routing';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Search,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  X,
  Check,
  ArrowRight,
  Sparkles,
  CalendarDays,
  Heart,
  Share2,
  Copy,
  MessageSquare,
  Eye,
  Briefcase,
  Crown,
  CalendarClock,
  ClockAlert
} from 'lucide-react';
import { FaWhatsapp, FaFacebook } from 'react-icons/fa';
import { clsx } from 'clsx';
import { useFavorites } from '@/hooks/useFavorites';
import { buildShareUrl, shareWhatsApp, shareFacebook, copyLink } from '@/lib/share';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import type { LocationSuggestion } from '@/hooks/useLocationAutocomplete';
import { useCategories, getTranslatedTitle, getCategoryLabelForTitle, type Locale } from '@/hooks/useCategories';

const DEFAULT_JOBS_PER_PAGE = 10;

const JOB_TYPE_URL_TO_VALUE: Record<string, string> = {
  fullTime: 'Full-time',
  partTime: 'Part-time',
  contract: 'Contract',
  remote: 'Remote'
};
const JOB_TYPE_VALUE_TO_URL: Record<string, string> = {
  'Full-time': 'fullTime',
  'Part-time': 'partTime',
  Contract: 'contract',
  Remote: 'remote'
};
const EXPERIENCE_URL_TO_VALUE: Record<string, string> = {
  entry: 'Entry Level',
  intermediate: 'Intermediate',
  senior: 'Senior'
};
const EXPERIENCE_VALUE_TO_URL: Record<string, string> = {
  'Entry Level': 'entry',
  Intermediate: 'intermediate',
  Senior: 'senior',
  Expert: 'senior'
};

const POSTED_OPTIONS = [
  { value: '24h', hours: 24, labelKey: 'newJobs' as const },
  { value: '7d', hours: 24 * 7, labelKey: 'lastWeek' as const },
  { value: '14d', hours: 24 * 14, labelKey: 'last2Weeks' as const },
  { value: '30d', hours: 24 * 30, labelKey: 'last30Days' as const },
  { value: '', hours: Infinity, labelKey: 'anytime' as const }
];

function parseSalaryRange(salaryStr: string): { min: number; max: number } | null {
  const matches = salaryStr.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const min = parseInt(matches[0], 10);
  const max = matches.length >= 2 ? parseInt(matches[1], 10) : min;
  return { min, max };
}

type JobItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  postedHours: number;
  workModel: 'remote' | 'hybrid' | 'onsite';
  logo: string;
  description: string;
  experience: string;
  verified: boolean;
  category: string;
  salaryAmount: number;
  salaryPeriod: 'hour' | 'month' | 'year' | 'provision';
  currency: string;
  when: 'urgent' | 'negotiation';
  contactPhone: string;
  contactEmail: string;
  ownerId: string;
  isBoosted: boolean;
};

interface BackendJob {
  id: string;
  userId: string;
  category: string;
  contactName: string;
  contactSurname: string;
  contactPhone: string;
  contactEmail: string | null;
  companyName: string | null;
  salary: number | null;
  salaryType: string;
  currency: string | null;
  locationState: string;
  locationCity: string;
  when: string;
  description: string | null;
  status: string;
  views: number;
  createdAt: string;
  countryCode: string | null;
  images: { url: string }[];
  user?: { displayName: string | null; isPremium?: boolean };
  isBoosted?: boolean;
}

function mapBackendJob(j: BackendJob, locale: string = 'sq', cats: import('@/hooks/useCategories').JobCategory[] = []): JobItem {
  const hoursAgo = Math.max(1, Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 3600000));
  const salaryPeriod = (j.salaryType || 'Hour').toLowerCase() as 'hour' | 'month' | 'year' | 'provision';
  const cur = j.currency || currencyFromCountryCode(j.countryCode);
  const salaryLabel = j.salary
    ? (salaryPeriod === 'provision' ? `${j.salary}%` : `${cur} ${j.salary.toLocaleString()}/${salaryPeriod}`)
    : '';
  const provisionFlag = salaryPeriod === 'provision';
  const translatedTitle = getTranslatedTitle(cats, j.category, locale as Locale);
  return {
    id: j.id,
    title: translatedTitle,
    company: j.user?.displayName || 'Privat',
    location: jobLocation(j.locationCity, j.countryCode, locale),
    type: 'Full-time',
    salary: salaryLabel,
    posted: '',
    postedHours: hoursAgo,
    workModel: 'onsite',
    logo: translatedTitle.charAt(0),
    description: j.description || '',
    experience: 'Entry Level',
    verified: true,
    category: j.category,
    salaryAmount: j.salary || 0,
    salaryPeriod,
    currency: cur,
    when: (j.when || 'Negotiation').toLowerCase() as 'urgent' | 'negotiation',
    contactPhone: j.contactPhone,
    contactEmail: j.contactEmail || '',
    ownerId: j.userId,
    isBoosted: j.isBoosted || j.user?.isPremium || false,
  };
}

const JOBS_PER_PAGE = 10;

// Sidebar filter section component
const FilterSection = ({
  title,
  children,
  defaultOpen = true
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-6 last:mb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-3 text-left group"
      >
        <span className="text-[15px] font-bold text-[#0B1F44]">
          {title}
        </span>
        <ChevronDown
          size={15}
          className={clsx(
            'text-slate-400 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

export default function JobsContent() {
  const t = useTranslations('Jobs');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const jsConfig = getJobSeekerConfig();
  const jobsPageConfig = jsConfig.jobsPage;
  const jobsPerPage = jobsPageConfig.resultsPerPage ?? DEFAULT_JOBS_PER_PAGE;
  const allowApply = jsConfig.features.allowApplyToJobs;
  const { categories } = useCategories();

  // Auth guard: login required, job-seekers only
  useEffect(() => {
    const session = getSession();
    if (!session?.isAuthenticated) {
      router.replace('/auth/login');
    } else if (session.role === 'employer') {
      router.replace('/candidates');
    }
  }, [router]);

  // Onboarding guard: block logged-in users without listings
  // null = still checking, false = has listings, true = needs onboarding
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    const session = getSession();
    const token = getToken();
    if (!session?.isAuthenticated || !token) { setNeedsOnboarding(false); return; }
    const endpoint = session.role === 'employer' ? '/api/jobs/mine' : '/api/ads/mine';
    api.get<{ ok: boolean; jobs?: unknown[]; ads?: unknown[] }>(endpoint, token)
      .then((res) => {
        const items = session.role === 'employer' ? res.jobs : res.ads;
        const hasItems = res.ok && items && items.length > 0;
        setNeedsOnboarding(!hasItems);
      })
      .catch(() => { setNeedsOnboarding(false); });
  }, []);

  // State for active filter dropdown
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { isFavorited, toggleFavorite: toggleFav, trackShare } = useFavorites();
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [backendTotal, setBackendTotal] = useState(0);
  const [backendTotalPages, setBackendTotalPages] = useState(1);
  const [initialReady, setInitialReady] = useState(false);

  // Scroll restoration: save/restore state when navigating away and back
  const SCROLL_CACHE_KEY = 'jobs_scroll_cache';
  const skipNextFetchRef = useRef(false);

  // Restore from cache on mount (e.g. after user wrote a message and came back)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SCROLL_CACHE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(SCROLL_CACHE_KEY);
      const cache = JSON.parse(raw);
      if (Date.now() - cache.timestamp > 30 * 60 * 1000) return;
      skipNextFetchRef.current = true;
      setJobs(cache.jobs);
      setPage(cache.page);
      setBackendTotal(cache.backendTotal);
      setBackendTotalPages(cache.backendTotalPages);
      setJobsLoading(false);
      setInitialReady(true);
      requestAnimationFrame(() => {
        setTimeout(() => window.scrollTo(0, cache.scrollY), 50);
      });
    } catch {}
  }, []);

  const saveScrollState = () => {
    try {
      sessionStorage.setItem(SCROLL_CACHE_KEY, JSON.stringify({
        jobs, page, backendTotal, backendTotalPages,
        scrollY: window.scrollY, timestamp: Date.now()
      }));
    } catch {}
  };

  const toggleFavorite = (id: string) => { toggleFav('job', id); };

  const openJobDetail = (job: JobItem) => {
    setSelectedJob(job);
    const token = getToken() || undefined;
    api.get<{ ok: boolean; job: BackendJob }>(`/api/jobs/${job.id}`, token)
      .catch(() => {});
  };

  const salaryPeriodLabel = (period: string) => {
    if (period === 'provision') return '';
    const labels: Record<string, Record<string, string>> = {
      hour: { de: '/Stunde', en: '/hour', fr: '/heure', it: '/ora', sq: '/orë' },
      month: { de: '/Monat', en: '/month', fr: '/mois', it: '/mese', sq: '/muaj' },
      year: { de: '/Jahr', en: '/year', fr: '/an', it: '/anno', sq: '/vit' },
    };
    return labels[period]?.[locale] ?? labels[period]?.en ?? '';
  };

  const provisionLabel = { de: 'Provision', en: 'Commission', fr: 'Commission', it: 'Provvigione', sq: 'Provision' }[locale] || 'Commission';

  const whenLabel = (when: string, withPrefix = false) => {
    const labels: Record<string, Record<string, string>> = {
      urgent: { de: 'Dringend', en: 'Urgent', fr: 'Urgent', it: 'Urgente', sq: 'Urgjente' },
      negotiation: { de: 'Verhandlung', en: 'Negotiation', fr: 'Négociation', it: 'Negoziazione', sq: 'Negociatë' },
    };
    const val = labels[when]?.[locale] ?? labels[when]?.en ?? when;
    if (!withPrefix) return val;
    
    const prefixes: Record<string, string> = {
      de: 'Wann: ', en: 'When: ', fr: 'Quand : ', it: 'Quando: ', sq: 'Kur: '
    };
    return (prefixes[locale] || prefixes.en) + val;
  };

  const contactLabel = locale === 'de' ? 'Kontaktieren' : locale === 'fr' ? 'Contacter' : locale === 'it' ? 'Contattare' : locale === 'sq' ? 'Kontaktoni' : 'Contact';
  const addFavLabel = locale === 'de' ? 'Zu Favoriten' : locale === 'fr' ? 'Ajouter aux favoris' : locale === 'it' ? 'Aggiungi ai preferiti' : locale === 'sq' ? 'Shto në preferenca' : 'Add to favorites';
  const savedLabel = locale === 'de' ? 'Gespeichert' : locale === 'fr' ? 'Enregistré' : locale === 'it' ? 'Salvato' : locale === 'sq' ? 'Ruajtur' : 'Saved';
  const shareLabel = locale === 'de' ? 'Mit einem Freund teilen' : locale === 'fr' ? 'Partager avec un ami' : locale === 'it' ? 'Condividi con un amico' : locale === 'sq' ? 'Ndaj me një mik' : 'Share with a friend';
  const showMoreLabel = locale === 'de' ? 'Mehr anzeigen' : locale === 'fr' ? 'Voir plus' : locale === 'it' ? 'Mostra di più' : locale === 'sq' ? 'Shfaq më shumë' : 'Show more';
  const contactSentLabel = locale === 'de' ? 'Kontaktanfrage gesendet!' : locale === 'fr' ? 'Demande envoyée !' : locale === 'it' ? 'Richiesta inviata!' : locale === 'sq' ? 'Kërkesa u dërgua!' : 'Contact request sent!';
  const linkCopiedLabel = locale === 'de' ? 'Link kopiert!' : locale === 'fr' ? 'Lien copié !' : locale === 'it' ? 'Link copiato!' : locale === 'sq' ? 'Linku u kopjua!' : 'Link copied!';
  
  const filtersRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const paramsFromUrl = useMemo(
    () => parseJobSearchParams({ get: (k) => searchParams.get(k) }),
    [searchParams]
  );

  const [keyword, setKeyword] = useState(paramsFromUrl.keyword);
  const [location, setLocation] = useState(paramsFromUrl.location);
  const [searchLat, setSearchLat] = useState<number | null>(null);
  const [searchLng, setSearchLng] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState(100);
  const [jobType, setJobType] = useState<string[]>(paramsFromUrl.jobType);
  const [experience, setExperience] = useState<string[]>(paramsFromUrl.experience);
  const [salaryMin, setSalaryMin] = useState<number | null>(paramsFromUrl.salaryMin);
  const [salaryMax, setSalaryMax] = useState<number | null>(paramsFromUrl.salaryMax);
  const [posted, setPosted] = useState<string | undefined>(paramsFromUrl.posted);
  const [workModel, setWorkModel] = useState<string[]>(paramsFromUrl.workModel ?? []);
  const [sort, setSort] = useState<'relevance' | 'date'>(paramsFromUrl.sort);
  const [page, setPage] = useState(paramsFromUrl.page);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [whenFilter, setWhenFilter] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // All categories from DB, filtered by search
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
  }, [categorySearch, locale, categories]);

  // Mobile category autocomplete
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const mobileCatRef = useRef<HTMLDivElement>(null);

  const mobileCatSuggestions = useMemo(() => {
    const q = keyword.toLowerCase().trim();
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
  }, [keyword, categories, locale]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mobileCatRef.current && !mobileCatRef.current.contains(e.target as Node)) setMobileCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load jobs from backend with pagination + server-side filters
  const fetchJobs = useCallback((append = false) => {
    if (append) { setLoadingMore(true); } else { setJobsLoading(true); }
    const qp = new URLSearchParams();
    qp.set('page', String(append ? page : 1));
    qp.set('limit', String(JOBS_PER_PAGE));
    if (keyword.trim()) qp.set('keyword', keyword.trim());
    if (location.trim()) {
      qp.set('location', location.trim());
    }
    if (searchLat != null && searchLng != null) {
      qp.set('lat', String(searchLat));
      qp.set('lng', String(searchLng));
      qp.set('radius', String(searchRadius));
    }
    if (categoryFilter.length) qp.set('category', categoryFilter.join(','));
    if (whenFilter.length) qp.set('when', whenFilter.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(','));
    if (posted) qp.set('posted', posted);
    if (salaryMin != null && salaryMin > 0) qp.set('salaryMin', String(salaryMin));
    if (salaryMax != null && salaryMax > 0) qp.set('salaryMax', String(salaryMax));
    qp.set('sort', sort);
    api.get<{ ok: boolean; jobs: BackendJob[]; total: number; totalPages: number }>(`/api/jobs?${qp}`)
      .then((res) => {
        if (res.ok) {
          const mapped = res.jobs.map((j) => mapBackendJob(j, locale, categories));
          setJobs(prev => {
            if (!append) return mapped;
            const existingIds = new Set(prev.map(j => j.id));
            return [...prev, ...mapped.filter(j => !existingIds.has(j.id))];
          });
          setBackendTotal(res.total);
          setBackendTotalPages(res.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => { setJobsLoading(false); setLoadingMore(false); setInitialReady(true); });
  }, [page, keyword, location, searchLat, searchLng, searchRadius, categoryFilter, whenFilter, posted, salaryMin, salaryMax, sort]);

  useEffect(() => {
    if (skipNextFetchRef.current) { skipNextFetchRef.current = false; return; }
    fetchJobs(page > 1);
  }, [fetchJobs]);

  // Auto-open detail modal when ?id= param is present (shared link)
  useEffect(() => {
    const sharedId = searchParams.get('id');
    if (!sharedId) return;
    const token = getToken() || undefined;
    api.get<{ ok: boolean; job: BackendJob }>(`/api/jobs/${sharedId}`, token)
      .then((res) => { if (res.ok) setSelectedJob(mapBackendJob(res.job, locale, categories)); })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    setKeyword(paramsFromUrl.keyword);
    setLocation(paramsFromUrl.location);
    setJobType(paramsFromUrl.jobType);
    setExperience(paramsFromUrl.experience);
    setSalaryMin(paramsFromUrl.salaryMin);
    setSalaryMax(paramsFromUrl.salaryMax);
    setPosted(paramsFromUrl.posted);
    setWorkModel(paramsFromUrl.workModel ?? []);
    setSort(paramsFromUrl.sort);
    setPage(paramsFromUrl.page);
    // Auto-geocode location from URL to enable radius search
    if (paramsFromUrl.location && searchLat == null) {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(paramsFromUrl.location)}&format=json&limit=1`)
        .then((r) => r.json())
        .then((data) => {
          if (data.length > 0) {
            setSearchLat(parseFloat(data[0].lat));
            setSearchLng(parseFloat(data[0].lon));
          }
        })
        .catch(() => {});
    }
  }, [
    paramsFromUrl.keyword,
    paramsFromUrl.location,
    paramsFromUrl.jobType.join(','),
    paramsFromUrl.experience.join(','),
    paramsFromUrl.salaryMin,
    paramsFromUrl.salaryMax,
    paramsFromUrl.posted,
    (paramsFromUrl.workModel ?? []).join(','),
    paramsFromUrl.sort,
    paramsFromUrl.page
  ]);

  const updateUrl = useCallback(
    (updates: Partial<JobSearchParams>, resetPage = true) => {
      const next: Partial<JobSearchParams> = {
        keyword,
        location,
        jobType,
        experience,
        salaryMin: salaryMin ?? undefined,
        salaryMax: salaryMax ?? undefined,
        posted,
        workModel: workModel.length ? workModel : undefined,
        sort,
        page: resetPage ? 1 : page
      };
      Object.assign(next, updates);
      if (resetPage && !('page' in updates)) next.page = 1;
      const path = buildJobsSearchPath(next);
      router.replace(path);
    },
    [router, keyword, location, jobType, experience, salaryMin, salaryMax, posted, workModel, sort, page]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateUrl({ keyword: keyword.trim(), location: location.trim() });
    },
    [updateUrl, keyword, location]
  );

  const typeValues = useMemo(
    () => jobType.map((k) => JOB_TYPE_URL_TO_VALUE[k]).filter(Boolean),
    [jobType]
  );
  const experienceValues = useMemo(
    () => experience.map((k) => EXPERIENCE_URL_TO_VALUE[k]).filter(Boolean),
    [experience]
  );

  const formatTimeAgo = (hours: number) => {
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' });
      if (hours < 24) {
        return rtf.format(-hours, 'hour');
      }
      const days = Math.floor(hours / 24);
      return rtf.format(-days, 'day');
    } catch (e) {
      return `${hours}h`; // Fallback
    }
  };

  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    if (sort === 'date') {
      list.sort((a, b) => a.postedHours - b.postedHours);
    }
    return list;
  }, [jobs, sort]);

  const totalPages = backendTotalPages;
  const safePage = Math.min(page, totalPages);
  const paginatedJobs = filteredJobs;

  const jobTypes = [
    { key: 'fullTime', label: t('fullTime') },
    { key: 'partTime', label: t('partTime') },
    { key: 'contract', label: t('contract') },
    { key: 'remote', label: t('remote') }
  ];
  const experienceLevels = [
    { key: 'entry', label: t('entry') },
    { key: 'intermediate', label: t('intermediate') },
    { key: 'senior', label: t('senior') }
  ];

  const toggleJobType = (key: string) => {
    const next = jobType.includes(key) ? jobType.filter((x) => x !== key) : [...jobType, key];
    setJobType(next);
    updateUrl({ jobType: next });
  };

  const toggleExperience = (key: string) => {
    const next = experience.includes(key) ? experience.filter((x) => x !== key) : [...experience, key];
    setExperience(next);
    updateUrl({ experience: next });
  };

  const toggleWorkModel = (key: string) => {
    const next = workModel.includes(key) ? workModel.filter((x) => x !== key) : [...workModel, key];
    setWorkModel(next);
    updateUrl({ workModel: next.length ? next : undefined });
  };

  const handleSortChange = (value: 'relevance' | 'date') => {
    setSort(value);
    setPage(1);
    updateUrl({ sort: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    const p = Math.max(1, Math.min(newPage, totalPages));
    setPage(p);
    updateUrl({ page: p });
  };

  const handleClearAll = () => {
    setKeyword('');
    setLocation('');
    setSearchLat(null);
    setSearchLng(null);
    setSearchRadius(100);
    setJobType([]);
    setExperience([]);
    setCategoryFilter([]);
    setWhenFilter([]);
    setSalaryMin(null);
    setSalaryMax(null);
    setPosted(undefined);
    setWorkModel([]);
    setSort('relevance');
    setPage(1);
    setActiveDropdown(null);
    router.replace('/jobs');
  };

  const hasActiveFilters = !!keyword.trim() || !!location.trim() || jobType.length > 0 || categoryFilter.length > 0 || whenFilter.length > 0 || !!posted || (salaryMin != null && salaryMin > 0) || (salaryMax != null && salaryMax > 0);

  // Profession / category filter (shown at the top, before location)
  const professionFilterContent = (
    <FilterSection title={locale === 'de' ? 'Beruf' : locale === 'fr' ? 'Profession' : locale === 'it' ? 'Professione' : locale === 'sq' ? 'Profesioni' : 'Profession'}>
      <div className="space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder={locale === 'de' ? 'Suchen...' : locale === 'fr' ? 'Rechercher...' : locale === 'it' ? 'Cerca...' : locale === 'sq' ? 'Kërko...' : 'Search...'}
            className="w-full pl-8 pr-3 py-2 text-[12px] font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#162C66]/20 focus:border-[#162C66]/30 outline-none transition-all"
          />
        </div>
        <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {filteredCategoryGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.slug) || categorySearch.length > 0;
            const visibleTitles = isExpanded ? group.titles : [];
            const selectedInGroup = group.titles.filter((t) => categoryFilter.includes(t.key)).length;
            return (
              <div key={group.slug} className="mb-1">
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
          })}
        </div>
      </div>
    </FilterSection>
  );

  // Shared filter sidebar content (used in desktop sidebar and mobile sheet)
  const filterSidebarContent = (
    <>
      <FilterSection title={t('datePosted')}>
        <div className="space-y-1">
          {POSTED_OPTIONS.map((o) => (
            <button
              key={o.value || 'any'}
              onClick={() => {
                setPosted(o.value || undefined);
                updateUrl({ posted: o.value || undefined });
              }}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between',
                (posted ?? '') === o.value
                  ? 'bg-[#162C66]/[0.06] text-[#162C66]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              {t(o.labelKey)}
              {(posted ?? '') === o.value && <Check size={14} className="text-[#162C66]" />}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={locale === 'de' ? 'Wann?' : locale === 'fr' ? 'Quand ?' : locale === 'it' ? 'Quando?' : locale === 'sq' ? 'Kur?' : 'When?'}>
        <div className="space-y-1.5">
          {[
            { key: 'urgent', label: whenLabel('urgent') },
            { key: 'negotiation', label: whenLabel('negotiation') }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={whenFilter.includes(key)}
                  onChange={() => {
                    const next = whenFilter.includes(key) ? whenFilter.filter((w) => w !== key) : [...whenFilter, key];
                    setWhenFilter(next);
                    setPage(1);
                  }}
                  className="peer appearance-none w-4 h-4 border-[1.5px] border-slate-300 rounded checked:bg-[#162C66] checked:border-[#162C66] transition-all"
                />
                <Check size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="text-[13px] font-medium text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title={t('salaryRange')}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-[#162C66]">{salaryMin ?? 0} €</span>
            <span className="text-[13px] font-semibold text-[#162C66]">{salaryMax ?? 10000}+ €</span>
          </div>
          <input
            type="range"
            min={0}
            max={10000}
            step={100}
            value={salaryMin ?? 0}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setSalaryMin(v);
            }}
            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#162C66]"
          />
          <p className="text-[11px] text-slate-400 font-medium mt-2">{t('salaryGross')}</p>
        </div>
      </FilterSection>

      {hasActiveFilters && (
        <div className="pt-4">
          <button
            onClick={handleClearAll}
            className="w-full text-[13px] font-semibold text-red-500 hover:text-red-600 py-2.5 rounded-lg border border-red-200/60 hover:bg-red-50 transition-all"
          >
            {t('resetFilters')}
          </button>
        </div>
      )}
    </>
  );

  // Don't render anything until initial data is ready — prevents "0 results" flash
  if (!initialReady) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F2F5]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-[3px] border-slate-200/60" />
              <div className="absolute inset-0 w-10 h-10 rounded-full border-[3px] border-transparent border-t-[#162C66] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-[#162C66] rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If logged-in user needs onboarding, block the search page
  if (needsOnboarding === true) {
    const session = getSession();
    const isEmployer = session?.role === 'employer';
    return (
      <div className="flex flex-col min-h-screen bg-[#F0F2F5]">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] p-8">
              <div className="w-14 h-14 bg-gradient-to-br from-[#162C66] to-[#0F1E45] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#162C66]/20">
                <Search size={24} className="text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F44] tracking-tight mb-2">
                {locale === 'de' ? 'Erst Anzeige erstellen' : locale === 'fr' ? 'Créez d\'abord une annonce' : locale === 'it' ? 'Prima crea un annuncio' : locale === 'sq' ? 'Së pari krijoni një shpallje' : 'Create a listing first'}
              </h2>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-6">
                {locale === 'de' ? 'Um die Suche nutzen zu können, erstellen Sie bitte zuerst Ihre erste Anzeige.' : locale === 'fr' ? 'Pour utiliser la recherche, veuillez d\'abord créer votre première annonce.' : locale === 'it' ? 'Per utilizzare la ricerca, crea prima il tuo primo annuncio.' : locale === 'sq' ? 'Për të përdorur kërkimin, ju lutem krijoni fillimisht shpalljen tuaj të parë.' : 'To use search, please create your first listing.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isEmployer) window.location.href = `/${locale}/dashboard/employer/jobs/new`;
                  else window.location.href = `/${locale}/dashboard/job-seeker/my-ads`;
                }}
                className="group inline-flex items-center gap-2.5 px-6 py-3 bg-[#162C66] text-white text-sm font-bold rounded-xl hover:bg-[#0F1E45] transition-all duration-300 shadow-lg shadow-[#162C66]/25 hover:-translate-y-0.5"
              >
                {isEmployer ? (locale === 'de' ? 'Stellenanzeige erstellen' : 'Create Job Listing') : (locale === 'de' ? 'Jobprofil erstellen' : 'Create Job Profile')}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5]">
      <Header />

      {/* Mobile Search Bar - Keyword + Location always visible on mobile */}
      <div className="lg:hidden bg-[#162C66] px-4 pt-4 pb-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="relative" ref={mobileCatRef}>
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none z-10" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setMobileCatOpen(true); }}
              onFocus={() => { if (keyword.trim()) setMobileCatOpen(true); }}
              placeholder={locale === 'de' ? 'Berufsbezeichnung, Stichwort...' : locale === 'fr' ? 'Profession, mot-clé...' : locale === 'it' ? 'Professione, parola chiave...' : locale === 'sq' ? 'Profesioni, fjala kyçe...' : 'Job title, keyword...'}
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
                      setKeyword('');
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
              value={location}
              onChange={(val) => { setLocation(val); setSearchLat(null); setSearchLng(null); }}
              onSelect={(s: LocationSuggestion) => { setLocation(shortSuggestionLabel(s)); setSearchLat(s.lat); setSearchLng(s.lng); }}
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
            {t('searchButton')}
          </button>
        </form>
      </div>

      <main className="flex-grow" ref={filtersRef}>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mr-1">
                  {locale === 'de' ? 'Filter' : locale === 'fr' ? 'Filtres' : locale === 'it' ? 'Filtri' : locale === 'sq' ? 'Filtra' : 'Filters'}:
                </span>
                {keyword.trim() && (
                  <button
                    onClick={() => { setKeyword(''); updateUrl({ keyword: '' }); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    {keyword}
                    <X size={12} />
                  </button>
                )}
                {location.trim() && (
                  <button
                    onClick={() => { setLocation(''); setSearchLat(null); setSearchLng(null); updateUrl({ location: '' }); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 text-[12px] font-semibold hover:bg-violet-100 transition-colors"
                  >
                    {location}
                    <X size={12} />
                  </button>
                )}
                {posted && (
                  <button
                    onClick={() => { setPosted(undefined); updateUrl({ posted: undefined }); }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#162C66]/[0.06] text-[#162C66] text-[12px] font-semibold hover:bg-[#162C66]/[0.1] transition-colors"
                  >
                    {t(POSTED_OPTIONS.find(o => o.value === posted)?.labelKey || 'anytime')}
                    <X size={12} />
                  </button>
                )}
                {jobType.map(key => (
                  <button
                    key={key}
                    onClick={() => toggleJobType(key)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#162C66]/[0.06] text-[#162C66] text-[12px] font-semibold hover:bg-[#162C66]/[0.1] transition-colors"
                  >
                    {t(key)}
                    <X size={12} />
                  </button>
                ))}
                {categoryFilter.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter.filter((c) => c !== cat))}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[12px] font-semibold hover:bg-blue-100 transition-colors"
                  >
                    {getTranslatedTitle(categories, cat, locale as Locale)}
                    <X size={12} />
                  </button>
                ))}
                {whenFilter.map(key => (
                  <button
                    key={key}
                    onClick={() => setWhenFilter(whenFilter.filter((w) => w !== key))}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[12px] font-semibold hover:bg-amber-100 transition-colors"
                  >
                    {whenLabel(key)}
                    <X size={12} />
                  </button>
                ))}
                <button
                  onClick={handleClearAll}
                  className="text-[12px] font-semibold text-red-500 hover:text-red-600 ml-2 transition-colors"
                >
                  {t('resetFilters')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Layout: Sidebar + Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-[280px] shrink-0">
              <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[18px] font-extrabold text-[#0B1F44]">
                    {locale === 'de' ? 'Filtern' : locale === 'fr' ? 'Filtrer' : locale === 'it' ? 'Filtra' : locale === 'sq' ? 'Filtro' : 'Filter'}
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAll}
                      className="text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                    >
                      {t('resetFilters')}
                    </button>
                  )}
                </div>

                {/* Profession filter (top) */}
                {professionFilterContent}

                {/* Location input */}
                <div className="mb-6">
                  <span className="text-[15px] font-bold text-[#0B1F44] mb-3 block">
                    {locale === 'de' ? 'Stadt oder Region' : locale === 'fr' ? 'Ville ou région' : locale === 'it' ? 'Città o regione' : locale === 'sq' ? 'Qyteti ose rajoni' : 'City or State'}
                  </span>
                  <LocationAutocomplete
                    value={location}
                    onChange={(val) => { setLocation(val); setSearchLat(null); setSearchLng(null); }}
                    onSelect={(s: LocationSuggestion) => { setLocation(shortSuggestionLabel(s)); setSearchLat(s.lat); setSearchLng(s.lng); }}
                    placeholder={t('locationPlaceholder')}
                    iconSize={16}
                    iconClassName="text-amber-500 left-3"
                    inputClassName="w-full pl-9 pr-8 py-2.5 text-[13px] font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#162C66]/20 focus:border-[#162C66]/30 outline-none transition-all"
                    className=""
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

                {filterSidebarContent}

                {/* Search button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => updateUrl({ location: location.trim() })}
                    className="w-full py-3 bg-[#162C66] text-white text-[14px] font-bold rounded-xl hover:bg-[#0F1E45] transition-all shadow-md shadow-[#162C66]/15"
                  >
                    {t('searchButton')}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F44] tracking-tight mb-1">
                  {location.trim()
                    ? (locale === 'de' ? `${backendTotal} Stellenangebote in ${location}` : locale === 'fr' ? `${backendTotal} offres d'emploi à ${location}` : locale === 'it' ? `${backendTotal} offerte di lavoro a ${location}` : locale === 'sq' ? `${backendTotal} oferta pune në ${location}` : `${backendTotal} job offers in ${location}`)
                    : (locale === 'de' ? `${backendTotal} Stellenangebote gefunden` : locale === 'fr' ? `${backendTotal} offres d'emploi trouvées` : locale === 'it' ? `${backendTotal} offerte di lavoro trovate` : locale === 'sq' ? `${backendTotal} oferta pune u gjetën` : `${backendTotal} job offers found`)}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[14px] font-medium text-slate-500">
                    {locale === 'de' ? `Wir haben ${backendTotal} Jobangebote passend zu Ihren Kriterien gefunden.` : locale === 'fr' ? `Nous avons trouvé ${backendTotal} offres correspondant à vos critères.` : locale === 'it' ? `Abbiamo trovato ${backendTotal} offerte corrispondenti ai tuoi criteri.` : locale === 'sq' ? `Kemi gjetur ${backendTotal} oferta që përputhen me kriteret tuaja.` : `We found ${backendTotal} job offers matching your criteria.`}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Mobile filter toggle */}
                    <button
                      type="button"
                      onClick={() => setMobileFiltersOpen(true)}
                      className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                    >
                      <SlidersHorizontal size={15} />
                      <span className="hidden xs:inline">Filter</span>
                      {hasActiveFilters && (
                        <span className="w-5 h-5 bg-[#162C66] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {jobType.length + categoryFilter.length + whenFilter.length + (posted ? 1 : 0) + ((salaryMin ?? 0) > 0 ? 1 : 0)}
                        </span>
                      )}
                    </button>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        onClick={() => handleSortChange('relevance')}
                        className={clsx(
                          'px-2.5 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-[12px] font-semibold transition-all flex items-center gap-1.5',
                          sort === 'relevance'
                            ? 'bg-[#162C66] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        <Sparkles size={12} />
                        {t('relevance')}
                      </button>
                      <button
                        onClick={() => handleSortChange('date')}
                        className={clsx(
                          'px-2.5 sm:px-3.5 py-1.5 rounded-md text-[11px] sm:text-[12px] font-semibold transition-all flex items-center gap-1.5',
                          sort === 'date'
                            ? 'bg-[#162C66] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        <CalendarDays size={12} />
                        {t('date')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Listings */}
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Search size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{t('noResults')}</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">{t('noResultsDesc')}</p>
                    <button
                      onClick={handleClearAll}
                      className="px-5 py-2.5 bg-[#162C66] text-white rounded-lg text-sm font-semibold hover:bg-[#0F1E45] transition-all"
                    >
                      {t('clearSearch')}
                    </button>
                  </div>
                ) : (
                  paginatedJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => openJobDetail(job)}
                      className={clsx('bg-white rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all overflow-hidden cursor-pointer', job.isBoosted ? 'border-[#F5C400]/60 ring-1 ring-[#F5C400]/20' : 'border-slate-200/60')}
                    >
                      {job.isBoosted && (
                        <div className="flex items-center gap-1.5 px-5 pt-3 pb-0">
                          <Crown size={13} className="text-[#F5C400]" />
                          <span className="text-[11px] font-bold text-[#F5C400] uppercase tracking-wider">Premium</span>
                        </div>
                      )}
                      <div className="p-5 sm:p-6">
                        {/* Row 1: Title + Heart/Share */}
                        <div className="flex items-start justify-between gap-3 mb-6">
                          <div>
                            <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1F44]">{job.title}</h3>
                            <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-1.5">
                              <Briefcase size={14} className="text-slate-400" />{getCategoryLabelForTitle(categories, job.category, locale as Locale)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(job.id); }}
                              className={clsx(
                                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                                isFavorited('job', job.id)
                                  ? 'bg-rose-100 text-rose-500 border border-rose-200'
                                  : 'bg-rose-50/80 text-rose-400 border border-rose-100/80 hover:text-rose-500 hover:bg-rose-100'
                              )}
                            >
                              <Heart size={16} fill={isFavorited('job', job.id) ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openJobDetail(job); setShowShareMenu(job.id); }}
                              className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50/80 text-blue-500 border border-blue-100/80 hover:text-blue-600 hover:bg-blue-100 transition-all"
                            >
                              <Share2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Tags (Left) + Salary (Right) */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 mb-6">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/50 text-amber-600 text-[12px] sm:text-[13px] font-bold rounded-lg border border-amber-200/60">
                              <MapPin size={13} className="text-amber-500" />
                              {job.location}
                            </span>
                            <span className={clsx(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] sm:text-[13px] font-bold rounded-lg border',
                              job.when === 'urgent'
                                ? 'bg-red-50/50 text-red-600 border-red-200/60'
                                : 'bg-[#F4F0FF] text-[#6B21A8] border-[#E9D5FF]'
                            )}>
                              {job.when === 'urgent' ? (
                                <ClockAlert size={12} className="text-red-400" />
                              ) : (
                                <CalendarClock size={12} className="text-[#9333EA]" />
                              )}
                              {whenLabel(job.when, true)}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-4 py-2 bg-[#EAFaf1] rounded-xl text-[#0B8A5A] text-[20px] sm:text-[22px] font-bold tracking-tight shrink-0">
                            {job.salaryPeriod === 'provision' ? `${job.salaryAmount}% ${provisionLabel}` : `${job.currency} ${job.salaryAmount.toLocaleString('de-CH')}${salaryPeriodLabel(job.salaryPeriod)}`}
                          </span>
                        </div>

                        {/* Row 4: Show more */}
                        <button
                          type="button"
                          onClick={() => openJobDetail(job)}
                          className="group/btn inline-flex items-center gap-2 px-5 py-2 bg-slate-50/80 text-[#0B1F44] text-[13px] font-bold rounded-xl hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all"
                        >
                          <Eye size={15} className="text-[#0B1F44] group-hover/btn:text-blue-600 transition-colors" />
                          {showMoreLabel}
                          <ArrowRight size={14} className="text-[#0B1F44] group-hover/btn:text-blue-600 transition-colors" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Load more */}
              {safePage < totalPages && (
                <div className="flex justify-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-[#162C66] hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      {loadingMore ? (
                        <span className="w-4 h-4 border-2 border-slate-200 border-t-[#162C66] rounded-full animate-spin" />
                      ) : (
                        <ChevronDown size={16} className="text-[#162C66]" />
                      )}
                      {t('loadMore')}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Filter Sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal size={16} />
                Filter
              </h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Profession filter (top) */}
              {professionFilterContent}

              {/* Location input */}
              <div className="mb-5">
                <span className="text-[14px] font-bold text-[#0B1F44] mb-2 block">
                  {locale === 'de' ? 'Stadt oder Region' : locale === 'fr' ? 'Ville ou région' : locale === 'it' ? 'Città o regione' : locale === 'sq' ? 'Qyteti ose rajoni' : 'City or State'}
                </span>
                <LocationAutocomplete
                  value={location}
                  onChange={(val) => { setLocation(val); setSearchLat(null); setSearchLng(null); }}
                  onSelect={(s: LocationSuggestion) => { setLocation(shortSuggestionLabel(s)); setSearchLat(s.lat); setSearchLng(s.lng); }}
                  placeholder={t('locationPlaceholder')}
                  iconSize={16}
                  iconClassName="text-amber-500 left-3"
                  inputClassName="w-full pl-9 pr-8 py-2.5 text-[13px] font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-[#162C66]/20 focus:border-[#162C66]/30 outline-none transition-all"
                  className=""
                />
              </div>
              {/* Max distance slider (mobile) */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-bold text-[#0B1F44]">
                    {locale === 'de' ? 'Max. Entfernung' : locale === 'fr' ? 'Distance max.' : locale === 'it' ? 'Distanza max.' : locale === 'sq' ? 'Distanca maks.' : 'Max. Distance'}
                  </span>
                  <span className="text-[13px] font-semibold text-slate-500">{searchRadius} km</span>
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
              {filterSidebarContent}
            </div>
            <div className="px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => { updateUrl({ location: location.trim() }); setMobileFiltersOpen(false); }}
                className="w-full h-11 bg-[#162C66] text-white rounded-lg text-[14px] font-bold hover:bg-[#0F1E45] transition-all"
              >
                {t('searchButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#162C66] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-bottom-4">
          {toast}
          <button type="button" onClick={() => setToast(null)} className="ml-3 text-white/60 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => { setSelectedJob(null); setShowShareMenu(null); }}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-5 sm:p-6 pb-4">
              <button
                type="button"
                onClick={() => { setSelectedJob(null); setShowShareMenu(null); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>

              {/* Job Title + Category */}
              <div className="mb-5 pr-10">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F44] leading-snug mb-2">{selectedJob.title}</h2>
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[12px] sm:text-[13px] font-bold rounded-lg border border-blue-100">{getCategoryLabelForTitle(categories, selectedJob.category, locale as Locale)}</span>
              </div>

              {/* Info rows */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-emerald-700 text-[13px] sm:text-base font-extrabold border border-emerald-100">
                  {selectedJob.salaryPeriod === 'provision' ? `${selectedJob.salaryAmount}% ${provisionLabel}` : `${selectedJob.currency} ${selectedJob.salaryAmount.toLocaleString('de-CH')}${salaryPeriodLabel(selectedJob.salaryPeriod)}`}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-[12px] sm:text-[13px] font-semibold rounded-lg border border-slate-200">
                  <MapPin size={13} className="text-slate-400" />
                  {selectedJob.location}
                </span>
                <span className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] sm:text-[13px] font-bold rounded-lg border',
                  selectedJob.when === 'urgent'
                    ? 'bg-red-50 text-red-600 border-red-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                )}>
                  {whenLabel(selectedJob.when)}
                </span>
              </div>
            </div>

            {/* Actions – Contact, Add to favorites, Share */}
            <div className="border-t border-slate-100 p-5 sm:p-6 pt-4 space-y-3">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 h-12 bg-[#162C66] text-white rounded-xl font-bold text-[14px] hover:bg-[#0F1E45] transition-all"
                onClick={async () => {
                  const token = getToken();
                  if (!token) { router.push('/auth/login'); return; }
                  saveScrollState();
                  try {
                    const res = await api.post<{ ok: boolean; conversation: { id: string } }>('/api/messages/conversations', { targetUserId: selectedJob.ownerId, jobId: selectedJob.id, jobTitle: selectedJob.title }, token);
                    setSelectedJob(null); setShowShareMenu(null);
                    router.push(`/dashboard/job-seeker/messages?conv=${res.conversation.id}`);
                  } catch { setToast(contactSentLabel); setTimeout(() => setToast(null), 3000); }
                }}
              >
                <MessageSquare size={18} />
                {contactLabel}
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(selectedJob.id)}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold border transition-all',
                  isFavorited('job', selectedJob.id)
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}
              >
                <Heart size={16} fill={isFavorited('job', selectedJob.id) ? 'currentColor' : 'none'} />
                {isFavorited('job', selectedJob.id) ? savedLabel : addFavLabel}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShareMenu(showShareMenu === selectedJob.id ? null : selectedJob.id)}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Share2 size={16} />
                  {shareLabel}
                </button>
                {showShareMenu === selectedJob.id && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-10">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedJob) { const url = buildShareUrl('job', selectedJob.id); shareWhatsApp(url); trackShare('job', selectedJob.id); } setShowShareMenu(null); setToast('WhatsApp!'); setTimeout(() => setToast(null), 3000); }}
                    >
                      <FaWhatsapp color="#25D366" size={16} /> WhatsApp
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedJob) { const url = buildShareUrl('job', selectedJob.id); shareFacebook(url); trackShare('job', selectedJob.id); } setShowShareMenu(null); setToast('Facebook!'); setTimeout(() => setToast(null), 3000); }}
                    >
                      <FaFacebook color="#1877F2" size={16} /> Facebook
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 text-[13px] font-semibold text-slate-700 transition-colors"
                      onClick={() => { if (selectedJob) { const url = buildShareUrl('job', selectedJob.id); copyLink(url); trackShare('job', selectedJob.id); } setShowShareMenu(null); setToast(linkCopiedLabel); setTimeout(() => setToast(null), 3000); }}
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

      <Footer />
    </div>
  );
}
