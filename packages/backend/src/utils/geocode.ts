/**
 * Resolve country code (ISO 3166-1 alpha-2) from lat/lng via Nominatim reverse geocoding.
 * Falls back to forward geocoding from a place name if coordinates are not available.
 */
export async function resolveCountryCode(opts: { lat?: number | null; lng?: number | null; place?: string | null }): Promise<string | null> {
  try {
    let url: string;
    if (opts.lat != null && opts.lng != null) {
      url = `https://nominatim.openstreetmap.org/reverse?lat=${opts.lat}&lon=${opts.lng}&format=json&accept-language=en`;
    } else if (opts.place) {
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(opts.place)}&format=json&limit=1&addressdetails=1`;
    } else {
      return null;
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'gjej-pune-app/1.0' },
    });
    const data = await res.json();

    if (Array.isArray(data)) {
      // forward geocoding response
      return data[0]?.address?.country_code?.toUpperCase() || null;
    }
    // reverse geocoding response
    return data?.address?.country_code?.toUpperCase() || null;
  } catch {
    return null;
  }
}

const COUNTRY_CURRENCY: Record<string, string> = {
  CH: 'CHF',
  GB: 'GBP',
  AL: 'ALL',
  TR: 'TRY',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  SE: 'SEK',
  DK: 'DKK',
  NO: 'NOK',
  IS: 'ISK',
  RS: 'RSD',
  MK: 'MKD',
  BA: 'BAM',
  UA: 'UAH',
  MD: 'MDL',
  BY: 'BYN',
  GE: 'GEL',
};

export function currencyFromCountryCode(code: string | null | undefined): string {
  if (!code) return 'EUR';
  return COUNTRY_CURRENCY[code.toUpperCase()] || 'EUR';
}
