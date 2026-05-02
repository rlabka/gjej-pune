/**
 * Shortens a full address to just "City, Country".
 * Examples:
 *   "Toulon, 12345, Provence-Alpes-Côte d'Azur, Frankreich" → "Toulon, Frankreich"
 *   "München, Bayern, Deutschland" → "München, Deutschland"
 *   "Turcey, 21540, Burgund und Freigrafschaft, Frankreich" → "Turcey, Frankreich"
 *   "Zürich" → "Zürich"
 *   "" → ""
 */
export function shortLocation(fullAddress: string | null | undefined): string {
  if (!fullAddress) return '';
  const trimmed = fullAddress.trim();
  if (!trimmed) return '';

  // Split by comma and trim each part
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);

  if (parts.length <= 1) return trimmed;

  // First part is always the city
  const city = parts[0];
  // Last part is the country (skip postal codes / regions in between)
  const country = parts[parts.length - 1];

  // If the last part looks like a postal code (only digits), use the part before it
  if (/^\d+$/.test(country) && parts.length > 2) {
    return `${city}, ${parts[parts.length - 2]}`;
  }

  return `${city}, ${country}`;
}

/**
 * Build short "City, Country" from a LocationSuggestion or similar object.
 */
export function shortSuggestionLabel(s: { city?: string; country?: string; label?: string }): string {
  const city = s.city?.trim();
  const country = s.country?.trim();
  if (city && country && city !== country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return s.label ? shortLocation(s.label) : '';
}

/**
 * Convert a 2-letter country code (ISO 3166-1) to a country name.
 * Returns the code itself as fallback if not found.
 */
const COUNTRY_NAMES: Record<string, string> = {
  CH: 'Schweiz', DE: 'Deutschland', AT: 'Österreich', FR: 'Frankreich',
  IT: 'Italien', ES: 'Spanien', PT: 'Portugal', NL: 'Niederlande',
  BE: 'Belgien', LU: 'Luxemburg', GB: 'UK', IE: 'Irland',
  US: 'USA', CA: 'Kanada', PL: 'Polen', CZ: 'Tschechien',
  SK: 'Slowakei', HU: 'Ungarn', RO: 'Rumänien', BG: 'Bulgarien',
  HR: 'Kroatien', SI: 'Slowenien', RS: 'Serbien', BA: 'Bosnien',
  ME: 'Montenegro', AL: 'Albanien', XK: 'Kosovo', MK: 'Nordmazedonien',
  GR: 'Griechenland', TR: 'Türkei', SE: 'Schweden', NO: 'Norwegen',
  DK: 'Dänemark', FI: 'Finnland', LI: 'Liechtenstein',
};

export function countryFromCode(code: string | null | undefined, locale?: string): string {
  if (!code) return '';
  const upper = code.toUpperCase();
  const deName = COUNTRY_NAMES[upper] || upper;
  if (!locale || locale === 'de') return deName;
  return translateCountryName(deName, locale);
}

/**
 * Build "City, Country" from structured job fields.
 */
export function jobLocation(city: string | null | undefined, countryCode: string | null | undefined, locale?: string): string {
  const c = city?.trim();
  const country = countryFromCode(countryCode, locale);
  if (c && country) return `${c}, ${country}`;
  return c || country || '';
}

// ─── Locale-aware country name translation ────────────────────────

type LocaleKey = 'de' | 'en' | 'fr' | 'it' | 'sq';

const _CH  = { de: 'Schweiz', en: 'Switzerland', fr: 'Suisse', it: 'Svizzera', sq: 'Zvicër' };
const _DE  = { de: 'Deutschland', en: 'Germany', fr: 'Allemagne', it: 'Germania', sq: 'Gjermani' };
const _AT  = { de: 'Österreich', en: 'Austria', fr: 'Autriche', it: 'Austria', sq: 'Austri' };
const _FR  = { de: 'Frankreich', en: 'France', fr: 'France', it: 'Francia', sq: 'Francë' };
const _IT  = { de: 'Italien', en: 'Italy', fr: 'Italie', it: 'Italia', sq: 'Itali' };
const _AL  = { de: 'Albanien', en: 'Albania', fr: 'Albanie', it: 'Albania', sq: 'Shqipëri' };
const _XK  = { de: 'Kosovo', en: 'Kosovo', fr: 'Kosovo', it: 'Kosovo', sq: 'Kosovë' };
const _MK  = { de: 'Nordmazedonien', en: 'North Macedonia', fr: 'Macédoine du Nord', it: 'Macedonia del Nord', sq: 'Maqedoni e Veriut' };
const _RS  = { de: 'Serbien', en: 'Serbia', fr: 'Serbie', it: 'Serbia', sq: 'Serbi' };
const _ME  = { de: 'Montenegro', en: 'Montenegro', fr: 'Monténégro', it: 'Montenegro', sq: 'Mal i Zi' };
const _HR  = { de: 'Kroatien', en: 'Croatia', fr: 'Croatie', it: 'Croazia', sq: 'Kroaci' };
const _BA  = { de: 'Bosnien und Herzegowina', en: 'Bosnia and Herzegovina', fr: 'Bosnie-Herzégovine', it: 'Bosnia ed Erzegovina', sq: 'Bosnjë dhe Hercegovinë' };
const _ES  = { de: 'Spanien', en: 'Spain', fr: 'Espagne', it: 'Spagna', sq: 'Spanjë' };
const _PT  = { de: 'Portugal', en: 'Portugal', fr: 'Portugal', it: 'Portogallo', sq: 'Portugali' };
const _GR  = { de: 'Griechenland', en: 'Greece', fr: 'Grèce', it: 'Grecia', sq: 'Greqi' };
const _TR  = { de: 'Türkei', en: 'Turkey', fr: 'Turquie', it: 'Turchia', sq: 'Turqi' };

const COUNTRY_I18N: Record<string, Record<LocaleKey, string>> = {
  // ── Swiss ──
  'Schweiz': _CH, 'Switzerland': _CH, 'Suisse': _CH, 'Svizzera': _CH, 'Zvicër': _CH,
  // ── Germany ──
  'Deutschland': _DE, 'Germany': _DE, 'Allemagne': _DE, 'Germania': _DE, 'Gjermani': _DE,
  // ── Austria ──
  'Österreich': _AT, 'Austria': _AT, 'Autriche': _AT, 'Austri': _AT,
  // ── France ──
  'Frankreich': _FR, 'France': _FR, 'Francia': _FR, 'Francë': _FR,
  // ── Italy ──
  'Italien': _IT, 'Italy': _IT, 'Italie': _IT, 'Italia': _IT, 'Itali': _IT,
  // ── Albania ──
  'Albanien': _AL, 'Albania': _AL, 'Albanie': _AL, 'Shqipëri': _AL,
  // ── Kosovo ──
  'Kosovo': _XK, 'Kosovë': _XK,
  // ── North Macedonia ──
  'Nordmazedonien': _MK, 'North Macedonia': _MK, 'Macédoine du Nord': _MK, 'Macedonia del Nord': _MK, 'Maqedoni e Veriut': _MK,
  // ── Serbia ──
  'Serbien': _RS, 'Serbia': _RS, 'Serbie': _RS, 'Serbi': _RS,
  // ── Montenegro ──
  'Montenegro': _ME, 'Monténégro': _ME, 'Mal i Zi': _ME,
  // ── Croatia ──
  'Kroatien': _HR, 'Croatia': _HR, 'Croatie': _HR, 'Croazia': _HR, 'Kroaci': _HR,
  // ── Bosnia ──
  'Bosnien und Herzegowina': _BA, 'Bosnia and Herzegovina': _BA, 'Bosnie-Herzégovine': _BA, 'Bosnia ed Erzegovina': _BA, 'Bosnjë dhe Hercegovinë': _BA,
  // ── Spain ──
  'Spanien': _ES, 'Spain': _ES, 'Espagne': _ES, 'Spagna': _ES, 'Spanjë': _ES,
  // ── Portugal ──
  'Portugal': _PT, 'Portogallo': _PT, 'Portugali': _PT,
  // ── Greece ──
  'Griechenland': _GR, 'Greece': _GR, 'Grèce': _GR, 'Grecia': _GR, 'Greqi': _GR,
  // ── Turkey ──
  'Türkei': _TR, 'Turkey': _TR, 'Turquie': _TR, 'Turchia': _TR, 'Turqi': _TR,
};

function translateCountryName(name: string, locale: string): string {
  const loc = (locale || 'de') as LocaleKey;
  const entry = COUNTRY_I18N[name];
  if (entry) return entry[loc] ?? name;
  return name;
}

/**
 * Translate country names in a "City, Country" location string.
 */
export function translateLocation(location: string, locale: string): string {
  if (!location) return '';
  const parts = location.split(',').map(p => p.trim());
  if (parts.length < 2) return location;
  const last = parts[parts.length - 1];
  const translated = translateCountryName(last, locale);
  if (translated !== last) {
    parts[parts.length - 1] = translated;
  }
  return parts.join(', ');
}
