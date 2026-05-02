import { useCallback, useEffect, useRef, useState } from 'react';

export interface LocationSuggestion {
  label: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
}

// Photon (komoot) — OSM-based geocoder built for autocomplete.
// Unlike Nominatim, it has no restrictive User-Agent / rate-limit policy.
const PHOTON_URL = 'https://photon.komoot.io/api/';
const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

interface LocalCountry {
  code: string;
  names: Record<string, string[]>;
  lat: number;
  lng: number;
}

const LOCAL_COUNTRIES: LocalCountry[] = [
  { code: 'CH', lat: 46.8, lng: 8.2, names: { de: ['Schweiz'], en: ['Switzerland'], fr: ['Suisse'], it: ['Svizzera'], sq: ['Zvicër', 'Zvicra'] } },
  { code: 'DE', lat: 51.2, lng: 10.4, names: { de: ['Deutschland'], en: ['Germany'], fr: ['Allemagne'], it: ['Germania'], sq: ['Gjermani', 'Gjermania'] } },
  { code: 'AT', lat: 47.5, lng: 14.6, names: { de: ['Österreich'], en: ['Austria'], fr: ['Autriche'], it: ['Austria'], sq: ['Austri', 'Austria'] } },
  { code: 'LI', lat: 47.2, lng: 9.5, names: { de: ['Liechtenstein'], en: ['Liechtenstein'], fr: ['Liechtenstein'], it: ['Liechtenstein'], sq: ['Lihtenshtajn'] } },
  { code: 'FR', lat: 46.2, lng: 2.2, names: { de: ['Frankreich'], en: ['France'], fr: ['France'], it: ['Francia'], sq: ['Francë', 'Franca'] } },
  { code: 'IT', lat: 41.9, lng: 12.6, names: { de: ['Italien'], en: ['Italy'], fr: ['Italie'], it: ['Italia'], sq: ['Itali', 'Italia'] } },
  { code: 'AL', lat: 41.2, lng: 20.2, names: { de: ['Albanien'], en: ['Albania'], fr: ['Albanie'], it: ['Albania'], sq: ['Shqipëri', 'Shqipëria'] } },
  { code: 'XK', lat: 42.6, lng: 20.9, names: { de: ['Kosovo'], en: ['Kosovo'], fr: ['Kosovo'], it: ['Kosovo'], sq: ['Kosovë', 'Kosova'] } },
  { code: 'MK', lat: 41.5, lng: 21.7, names: { de: ['Nordmazedonien'], en: ['North Macedonia'], fr: ['Macédoine du Nord'], it: ['Macedonia del Nord'], sq: ['Maqedoni', 'Maqedonia'] } },
  { code: 'RS', lat: 44.0, lng: 21.0, names: { de: ['Serbien'], en: ['Serbia'], fr: ['Serbie'], it: ['Serbia'], sq: ['Serbi', 'Serbia'] } },
  { code: 'GR', lat: 39.1, lng: 21.8, names: { de: ['Griechenland'], en: ['Greece'], fr: ['Grèce'], it: ['Grecia'], sq: ['Greqi', 'Greqia'] } },
];

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchLocalCountries(q: string, locale: string): LocationSuggestion[] {
  const lower = stripDiacritics(q.trim().toLowerCase());
  if (lower.length < MIN_CHARS) return [];

  const matches: LocationSuggestion[] = [];
  for (const c of LOCAL_COUNTRIES) {
    let matched = false;
    for (const names of Object.values(c.names)) {
      for (const name of names) {
        const norm = stripDiacritics(name.toLowerCase());
        if (norm.startsWith(lower) || lower.startsWith(norm)) {
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    if (!matched) continue;

    const localeNames =
      c.names[locale] || c.names['en'] || Object.values(c.names)[0];
    const displayName = localeNames[0];
    matches.push({
      label: displayName,
      city: displayName,
      state: '',
      postcode: '',
      country: displayName,
      countryCode: c.code,
      lat: c.lat,
      lng: c.lng,
    });
  }
  return matches;
}

function dedup(arr: LocationSuggestion[]): LocationSuggestion[] {
  const seen = new Set<string>();
  return arr.filter((s) => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
  };
};

// Blacklist: skip streets/houses/POIs — keep everything else
const EXCLUDED_KEYS = new Set([
  'highway',
  'amenity',
  'shop',
  'tourism',
  'leisure',
  'building',
  'historic',
  'natural',
  'waterway',
  'railway',
  'aeroway',
  'office',
  'craft',
]);

async function searchPhoton(
  q: string,
  signal: AbortSignal,
  locale = 'de'
): Promise<LocationSuggestion[]> {
  const params = new URLSearchParams({
    q: q.trim(),
    lang: ['de', 'en', 'fr', 'it'].includes(locale) ? locale : 'en',
    limit: '10',
  });
  const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!res.ok) return [];
  const data: { features?: PhotonFeature[] } = await res.json();
  const features = data.features ?? [];

  return features
    .filter((f) => {
      const key = f.properties?.osm_key ?? '';
      return !EXCLUDED_KEYS.has(key);
    })
    .map((f) => {
      const p = f.properties ?? {};
      const coords = f.geometry?.coordinates ?? [];
      const name = p.name ?? '';
      const city = p.city ?? '';
      const state = p.state ?? '';
      const postcode = p.postcode ?? '';
      const country = p.country ?? '';
      const countryCode = (p.countrycode ?? '').toUpperCase();
      const isCountry = p.osm_value === 'country';

      // Primary label: the place name itself (e.g. "Schweiz", "Köln", "Berlin")
      const primary = name || city || country;

      const parts: string[] = [primary];
      if (!isCountry) {
        if (state && state !== primary && state !== city) parts.push(state);
        if (country && country !== primary) parts.push(country);
      }
      const label = parts.filter(Boolean).join(', ') || q.trim();

      return {
        label,
        city: primary,
        state,
        postcode,
        country,
        countryCode,
        lat: typeof coords[1] === 'number' ? coords[1] : null,
        lng: typeof coords[0] === 'number' ? coords[0] : null,
      };
    })
    .filter((s) => s.city);
}

const PRIORITY_COUNTRIES = new Set(['CH', 'DE', 'AT', 'LI']);
function sortByCountryPriority(
  results: LocationSuggestion[]
): LocationSuggestion[] {
  return [...results].sort((a, b) => {
    const aPri = PRIORITY_COUNTRIES.has(a.countryCode) ? 0 : 1;
    const bPri = PRIORITY_COUNTRIES.has(b.countryCode) ? 0 : 1;
    return aPri - bPri;
  });
}

export function useLocationAutocomplete(locale = 'de') {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();

      if (q.trim().length < MIN_CHARS) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const [remote, local] = await Promise.all([
            searchPhoton(q, controller.signal, locale).catch(() => []),
            Promise.resolve(matchLocalCountries(q, locale)),
          ]);
          // Local country matches go FIRST if the query matches a country
          // name (e.g. "Schweiz" → 🇨🇭 before any German streets).
          const localCodes = new Set(local.map((l) => l.countryCode));
          const remoteFiltered = remote.filter(
            (r) => !localCodes.has(r.countryCode) || r.city !== r.country
          );
          const merged = [...local, ...remoteFiltered];
          setSuggestions(dedup(sortByCountryPriority(merged)));
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            setSuggestions([]);
          }
        } finally {
          setLoading(false);
        }
      }, DEBOUNCE_MS);
    },
    [locale]
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { query, setQuery, suggestions, loading, clear };
}
