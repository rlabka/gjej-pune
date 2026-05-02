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
  if (!code) return '€';
  return COUNTRY_CURRENCY[code.toUpperCase()] || '€';
}
