'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

// ─── Local country fallback for fuzzy/prefix matching ────────────────
// Nominatim doesn't know all language variants (e.g. Albanian).
// We keep a local list so "zvicer", "greqi" etc. always match.

interface LocalCountry {
  code: string;
  names: Record<string, string[]>; // locale → [name variants]
  lat: number;
  lng: number;
}

const LOCAL_COUNTRIES: LocalCountry[] = [
  { code: 'CH', lat: 46.8, lng: 8.2, names: { de: ['Schweiz'], en: ['Switzerland'], fr: ['Suisse'], it: ['Svizzera'], sq: ['Zvicër', 'Zvicra', 'Zvicër'] } },
  { code: 'DE', lat: 51.2, lng: 10.4, names: { de: ['Deutschland'], en: ['Germany'], fr: ['Allemagne'], it: ['Germania'], sq: ['Gjermani', 'Gjermania'] } },
  { code: 'AT', lat: 47.5, lng: 14.6, names: { de: ['Österreich'], en: ['Austria'], fr: ['Autriche'], it: ['Austria'], sq: ['Austri', 'Austria'] } },
  { code: 'LI', lat: 47.2, lng: 9.5, names: { de: ['Liechtenstein'], en: ['Liechtenstein'], fr: ['Liechtenstein'], it: ['Liechtenstein'], sq: ['Lihtenshtajn'] } },
  { code: 'FR', lat: 46.2, lng: 2.2, names: { de: ['Frankreich'], en: ['France'], fr: ['France'], it: ['Francia'], sq: ['Francë', 'Franca'] } },
  { code: 'IT', lat: 41.9, lng: 12.6, names: { de: ['Italien'], en: ['Italy'], fr: ['Italie'], it: ['Italia'], sq: ['Itali', 'Italia'] } },
  { code: 'ES', lat: 40.5, lng: -3.7, names: { de: ['Spanien'], en: ['Spain'], fr: ['Espagne'], it: ['Spagna'], sq: ['Spanjë', 'Spanja'] } },
  { code: 'PT', lat: 39.4, lng: -8.2, names: { de: ['Portugal'], en: ['Portugal'], fr: ['Portugal'], it: ['Portogallo'], sq: ['Portugali', 'Portugalia'] } },
  { code: 'GB', lat: 55.4, lng: -3.4, names: { de: ['Vereinigtes Königreich', 'Grossbritannien'], en: ['United Kingdom', 'Great Britain'], fr: ['Royaume-Uni'], it: ['Regno Unito'], sq: ['Mbretëria e Bashkuar', 'Britani'] } },
  { code: 'NL', lat: 52.1, lng: 5.3, names: { de: ['Niederlande', 'Holland'], en: ['Netherlands', 'Holland'], fr: ['Pays-Bas'], it: ['Paesi Bassi', 'Olanda'], sq: ['Holandë', 'Holanda'] } },
  { code: 'BE', lat: 50.5, lng: 4.5, names: { de: ['Belgien'], en: ['Belgium'], fr: ['Belgique'], it: ['Belgio'], sq: ['Belgjikë', 'Belgjika'] } },
  { code: 'LU', lat: 49.8, lng: 6.1, names: { de: ['Luxemburg'], en: ['Luxembourg'], fr: ['Luxembourg'], it: ['Lussemburgo'], sq: ['Luksemburg', 'Luksemburgu'] } },
  { code: 'DK', lat: 56.3, lng: 9.5, names: { de: ['Dänemark'], en: ['Denmark'], fr: ['Danemark'], it: ['Danimarca'], sq: ['Danimarkë', 'Danimarka'] } },
  { code: 'SE', lat: 60.1, lng: 18.6, names: { de: ['Schweden'], en: ['Sweden'], fr: ['Suède'], it: ['Svezia'], sq: ['Suedi', 'Suedia'] } },
  { code: 'NO', lat: 60.5, lng: 8.5, names: { de: ['Norwegen'], en: ['Norway'], fr: ['Norvège'], it: ['Norvegia'], sq: ['Norvegji', 'Norvegjia'] } },
  { code: 'FI', lat: 61.9, lng: 25.7, names: { de: ['Finnland'], en: ['Finland'], fr: ['Finlande'], it: ['Finlandia'], sq: ['Finlandë', 'Finlanda'] } },
  { code: 'IS', lat: 65.0, lng: -19.0, names: { de: ['Island'], en: ['Iceland'], fr: ['Islande'], it: ['Islanda'], sq: ['Islandë', 'Islanda'] } },
  { code: 'IE', lat: 53.4, lng: -8.2, names: { de: ['Irland'], en: ['Ireland'], fr: ['Irlande'], it: ['Irlanda'], sq: ['Irlandë', 'Irlanda'] } },
  { code: 'PL', lat: 51.9, lng: 19.1, names: { de: ['Polen'], en: ['Poland'], fr: ['Pologne'], it: ['Polonia'], sq: ['Poloni', 'Polonia'] } },
  { code: 'CZ', lat: 49.8, lng: 15.5, names: { de: ['Tschechien'], en: ['Czech Republic', 'Czechia'], fr: ['Tchéquie'], it: ['Repubblica Ceca'], sq: ['Çeki', 'Çekia'] } },
  { code: 'SK', lat: 48.7, lng: 19.7, names: { de: ['Slowakei'], en: ['Slovakia'], fr: ['Slovaquie'], it: ['Slovacchia'], sq: ['Sllovaki', 'Sllovakia'] } },
  { code: 'HU', lat: 47.2, lng: 19.5, names: { de: ['Ungarn'], en: ['Hungary'], fr: ['Hongrie'], it: ['Ungheria'], sq: ['Hungari', 'Hungaria'] } },
  { code: 'RO', lat: 45.9, lng: 24.9, names: { de: ['Rumänien'], en: ['Romania'], fr: ['Roumanie'], it: ['Romania'], sq: ['Rumani', 'Rumania'] } },
  { code: 'BG', lat: 42.7, lng: 25.5, names: { de: ['Bulgarien'], en: ['Bulgaria'], fr: ['Bulgarie'], it: ['Bulgaria'], sq: ['Bullgari', 'Bullgaria'] } },
  { code: 'GR', lat: 39.1, lng: 21.8, names: { de: ['Griechenland'], en: ['Greece'], fr: ['Grèce'], it: ['Grecia'], sq: ['Greqi', 'Greqia'] } },
  { code: 'TR', lat: 39.0, lng: 35.2, names: { de: ['Türkei'], en: ['Turkey', 'Türkiye'], fr: ['Turquie'], it: ['Turchia'], sq: ['Turqi', 'Turqia'] } },
  { code: 'AL', lat: 41.2, lng: 20.2, names: { de: ['Albanien'], en: ['Albania'], fr: ['Albanie'], it: ['Albania'], sq: ['Shqipëri', 'Shqipëria'] } },
  { code: 'XK', lat: 42.6, lng: 20.9, names: { de: ['Kosovo'], en: ['Kosovo'], fr: ['Kosovo'], it: ['Kosovo'], sq: ['Kosovë', 'Kosova'] } },
  { code: 'MK', lat: 41.5, lng: 21.7, names: { de: ['Nordmazedonien'], en: ['North Macedonia'], fr: ['Macédoine du Nord'], it: ['Macedonia del Nord'], sq: ['Maqedoni', 'Maqedonia'] } },
  { code: 'RS', lat: 44.0, lng: 21.0, names: { de: ['Serbien'], en: ['Serbia'], fr: ['Serbie'], it: ['Serbia'], sq: ['Serbi', 'Serbia'] } },
  { code: 'ME', lat: 42.7, lng: 19.4, names: { de: ['Montenegro'], en: ['Montenegro'], fr: ['Monténégro'], it: ['Montenegro'], sq: ['Mali i Zi'] } },
  { code: 'HR', lat: 45.1, lng: 15.2, names: { de: ['Kroatien'], en: ['Croatia'], fr: ['Croatie'], it: ['Croazia'], sq: ['Kroaci', 'Kroacia'] } },
  { code: 'BA', lat: 43.9, lng: 17.7, names: { de: ['Bosnien', 'Bosnien und Herzegowina'], en: ['Bosnia', 'Bosnia and Herzegovina'], fr: ['Bosnie', 'Bosnie-Herzégovine'], it: ['Bosnia', 'Bosnia ed Erzegovina'], sq: ['Bosnjë', 'Bosnjë dhe Hercegovinë'] } },
  { code: 'SI', lat: 46.2, lng: 14.8, names: { de: ['Slowenien'], en: ['Slovenia'], fr: ['Slovénie'], it: ['Slovenia'], sq: ['Slloveni', 'Sllovenia'] } },
  { code: 'EE', lat: 58.6, lng: 25.0, names: { de: ['Estland'], en: ['Estonia'], fr: ['Estonie'], it: ['Estonia'], sq: ['Estoni', 'Estonia'] } },
  { code: 'LV', lat: 56.9, lng: 24.1, names: { de: ['Lettland'], en: ['Latvia'], fr: ['Lettonie'], it: ['Lettonia'], sq: ['Letoni', 'Letonia'] } },
  { code: 'LT', lat: 55.2, lng: 23.9, names: { de: ['Litauen'], en: ['Lithuania'], fr: ['Lituanie'], it: ['Lituania'], sq: ['Lituani', 'Lituania'] } },
  { code: 'CY', lat: 35.1, lng: 33.4, names: { de: ['Zypern'], en: ['Cyprus'], fr: ['Chypre'], it: ['Cipro'], sq: ['Qipro'] } },
  { code: 'MT', lat: 35.9, lng: 14.4, names: { de: ['Malta'], en: ['Malta'], fr: ['Malte'], it: ['Malta'], sq: ['Maltë', 'Malta'] } },
  { code: 'UA', lat: 48.4, lng: 31.2, names: { de: ['Ukraine'], en: ['Ukraine'], fr: ['Ukraine'], it: ['Ucraina'], sq: ['Ukrainë', 'Ukraina'] } },
  { code: 'MD', lat: 47.4, lng: 28.4, names: { de: ['Moldawien'], en: ['Moldova'], fr: ['Moldavie'], it: ['Moldavia'], sq: ['Moldavi', 'Moldavia'] } },
  { code: 'BY', lat: 53.7, lng: 27.9, names: { de: ['Belarus', 'Weissrussland'], en: ['Belarus'], fr: ['Biélorussie'], it: ['Bielorussia'], sq: ['Bjellorusi', 'Bjellorusja'] } },
  { code: 'RU', lat: 61.5, lng: 105.3, names: { de: ['Russland'], en: ['Russia'], fr: ['Russie'], it: ['Russia'], sq: ['Rusi', 'Rusia'] } },
];

const FLAG_EMOJI: Record<string, string> = {
  CH: '🇨🇭', DE: '🇩🇪', AT: '🇦🇹', LI: '🇱🇮', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸', PT: '🇵🇹',
  GB: '🇬🇧', NL: '🇳🇱', BE: '🇧🇪', LU: '🇱🇺', DK: '🇩🇰', SE: '🇸🇪', NO: '🇳🇴', FI: '🇫🇮',
  IS: '🇮🇸', IE: '🇮🇪', PL: '🇵🇱', CZ: '🇨🇿', SK: '🇸🇰', HU: '🇭🇺', RO: '🇷🇴', BG: '🇧🇬',
  GR: '🇬🇷', TR: '🇹🇷', AL: '🇦🇱', XK: '🇽🇰', MK: '🇲🇰', RS: '🇷🇸', ME: '🇲🇪', HR: '🇭🇷',
  BA: '🇧🇦', SI: '🇸🇮', EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹', CY: '🇨🇾', MT: '🇲🇹', UA: '🇺🇦',
  MD: '🇲🇩', BY: '🇧🇾', RU: '🇷🇺',
};

/**
 * Strip diacritics so "zvicer" matches "Zvicër", "francë" matches "France", etc.
 */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Match query against local country names.
 * Uses diacritics-insensitive prefix matching so "zvicer" → "Zvicër",
 * "greqi" → "Greqi", etc.
 */
function matchLocalCountries(q: string, locale: string): LocationSuggestion[] {
  const lower = stripDiacritics(q.trim().toLowerCase());
  if (lower.length < MIN_CHARS) return [];

  const matches: LocationSuggestion[] = [];
  for (const c of LOCAL_COUNTRIES) {
    // Check all locales for prefix match (user might type in any language)
    let matched = false;
    for (const names of Object.values(c.names)) {
      for (const name of names) {
        const norm = stripDiacritics(name.toLowerCase());
        // Prefix match: "zvicer" matches "zvicer" (from "Zvicër")
        if (norm.startsWith(lower) || lower.startsWith(norm)) {
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    if (!matched) continue;

    // Use the name in the user's locale for the label
    const localeNames = c.names[locale] || c.names['en'] || Object.values(c.names)[0];
    const displayName = localeNames[0];
    const flag = FLAG_EMOJI[c.code] || '';
    matches.push({
      label: `${displayName} ${flag}`.trim(),
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

function isPostalCode(q: string): boolean {
  return /^\d{3,5}$/.test(q.trim());
}

function dedup(arr: LocationSuggestion[]): LocationSuggestion[] {
  const seen = new Set<string>();
  return arr.filter((s) => {
    if (seen.has(s.label)) return false;
    seen.add(s.label);
    return true;
  });
}

// Search by postal code via Nominatim (structured search)
async function searchByPostalCode(q: string, signal: AbortSignal, locale = 'de'): Promise<LocationSuggestion[]> {
  const params = new URLSearchParams({
    postalcode: q.trim(),
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    'accept-language': locale,
    viewbox: '-25,34,45,72',
    bounded: '1',
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: { 'User-Agent': 'job-matching-platform/1.0' },
  });
  const data: any[] = await res.json();

  return data
    .filter((r: any) => r.address && (r.address.city || r.address.town || r.address.village || r.address.municipality))
    .slice(0, 5)
    .map((r: any) => {
      const a = r.address || {};
      const city = a.city || a.town || a.village || a.municipality || '';
      const state = a.state || '';
      const postcode = a.postcode || q.trim();
      const country = a.country || '';

      const parts: string[] = [city];
      if (postcode) parts.push(postcode);
      if (state && state !== city) parts.push(state);
      if (country) parts.push(country);

      const lat = r.lat ? parseFloat(r.lat) : null;
      const lng = r.lon ? parseFloat(r.lon) : null;
      const countryCode = (a.country_code || '').toUpperCase();
      return { label: parts.join(', '), city, state, postcode, country, countryCode, lat, lng };
    });
}

// Search by city/place name via Nominatim
async function searchByNameNominatim(q: string, signal: AbortSignal, locale = 'de'): Promise<LocationSuggestion[]> {
  const params = new URLSearchParams({
    q: q.trim(),
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    'accept-language': locale,
    viewbox: '-25,34,45,72',
    bounded: '1',
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal,
    headers: { 'User-Agent': 'job-matching-platform/1.0' },
  });
  const data: any[] = await res.json();
  return data
    .filter((r: any) => r.address)
    .slice(0, 5)
    .map((r: any) => {
      const a = r.address || {};
      const city = a.city || a.town || a.village || a.municipality || '';
      const state = a.state || '';
      const postcode = a.postcode || '';
      const country = a.country || '';
      const isCountryLevel = !city && !state && country;
      const isStateLevel = !city && state;
      const parts: string[] = [];
      if (isCountryLevel) {
        parts.push(country);
      } else if (isStateLevel) {
        parts.push(state);
        if (country) parts.push(country);
      } else {
        if (city) parts.push(city);
        if (postcode) parts.push(postcode);
        if (state && state !== city) parts.push(state);
        if (country) parts.push(country);
      }
      const lat = r.lat ? parseFloat(r.lat) : null;
      const lng = r.lon ? parseFloat(r.lon) : null;
      const countryCode = (a.country_code || '').toUpperCase();
      return { label: parts.join(', ') || q.trim(), city: city || state || country, state, postcode, country, countryCode, lat, lng };
    });
}

// Prioritize CH/DE/AT/LI results
const PRIORITY_COUNTRIES = new Set(['CH', 'DE', 'AT', 'LI']);
function sortByCountryPriority(results: LocationSuggestion[]): LocationSuggestion[] {
  return [...results].sort((a, b) => {
    const aPri = PRIORITY_COUNTRIES.has(a.countryCode) ? 0 : 1;
    const bPri = PRIORITY_COUNTRIES.has(b.countryCode) ? 0 : 1;
    return aPri - bPri;
  });
}

// Search by city/place name via Nominatim + local country fallback
async function searchByName(q: string, signal: AbortSignal, locale = 'de'): Promise<LocationSuggestion[]> {
  const [nominatimResults, localResults] = await Promise.all([
    searchByNameNominatim(q, signal, locale),
    Promise.resolve(matchLocalCountries(q, locale)),
  ]);

  // Merge: local country matches first if Nominatim returned nothing,
  // otherwise append local matches that aren't already covered
  const seenCodes = new Set(nominatimResults.map((r) => r.countryCode));
  const uniqueLocal = localResults.filter((r) => !seenCodes.has(r.countryCode));

  const merged = nominatimResults.length > 0
    ? [...nominatimResults, ...uniqueLocal]
    : [...uniqueLocal];

  return sortByCountryPriority(merged);
}

export function useLocationAutocomplete(locale = 'de') {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
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
        const results = isPostalCode(q)
          ? await searchByPostalCode(q, controller.signal, locale)
          : await searchByName(q, controller.signal, locale);

        setSuggestions(dedup(results));
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, [locale]);

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
