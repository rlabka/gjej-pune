'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const COUNTRIES = [
  // Priorität: DACH
  { code: 'CH', dial: '+41' },
  { code: 'DE', dial: '+49' },
  { code: 'AT', dial: '+43' },
  { code: 'LI', dial: '+423' },
  // Restliche europäische Länder alphabetisch
  { code: 'AD', dial: '+376' },
  { code: 'AL', dial: '+355' },
  { code: 'BA', dial: '+387' },
  { code: 'BE', dial: '+32' },
  { code: 'BG', dial: '+359' },
  { code: 'BY', dial: '+375' },
  { code: 'CY', dial: '+357' },
  { code: 'CZ', dial: '+420' },
  { code: 'DK', dial: '+45' },
  { code: 'EE', dial: '+372' },
  { code: 'ES', dial: '+34' },
  { code: 'FI', dial: '+358' },
  { code: 'FR', dial: '+33' },
  { code: 'GB', dial: '+44' },
  { code: 'GE', dial: '+995' },
  { code: 'GR', dial: '+30' },
  { code: 'HR', dial: '+385' },
  { code: 'HU', dial: '+36' },
  { code: 'IE', dial: '+353' },
  { code: 'IS', dial: '+354' },
  { code: 'IT', dial: '+39' },
  { code: 'LT', dial: '+370' },
  { code: 'LU', dial: '+352' },
  { code: 'LV', dial: '+371' },
  { code: 'MC', dial: '+377' },
  { code: 'MD', dial: '+373' },
  { code: 'ME', dial: '+382' },
  { code: 'MK', dial: '+389' },
  { code: 'MT', dial: '+356' },
  { code: 'NL', dial: '+31' },
  { code: 'NO', dial: '+47' },
  { code: 'PL', dial: '+48' },
  { code: 'PT', dial: '+351' },
  { code: 'RO', dial: '+40' },
  { code: 'RS', dial: '+381' },
  { code: 'RU', dial: '+7' },
  { code: 'SE', dial: '+46' },
  { code: 'SI', dial: '+386' },
  { code: 'SK', dial: '+421' },
  { code: 'SM', dial: '+378' },
  { code: 'TR', dial: '+90' },
  { code: 'UA', dial: '+380' },
  { code: 'XK', dial: '+383' },
  // Ausserhalb Europa
  { code: 'US', dial: '+1' },
];

const COUNTRY_NAMES: Record<string, Record<string, string>> = {
  CH: { de: 'Schweiz', en: 'Switzerland', fr: 'Suisse', it: 'Svizzera', sq: 'Zvicra' },
  DE: { de: 'Deutschland', en: 'Germany', fr: 'Allemagne', it: 'Germania', sq: 'Gjermani' },
  AT: { de: 'Österreich', en: 'Austria', fr: 'Autriche', it: 'Austria', sq: 'Austri' },
  LI: { de: 'Liechtenstein', en: 'Liechtenstein', fr: 'Liechtenstein', it: 'Liechtenstein', sq: 'Lihtenshtajn' },
  AD: { de: 'Andorra', en: 'Andorra', fr: 'Andorre', it: 'Andorra', sq: 'Andorrë' },
  AL: { de: 'Albanien', en: 'Albania', fr: 'Albanie', it: 'Albania', sq: 'Shqipëri' },
  BA: { de: 'Bosnien und Herzegowina', en: 'Bosnia and Herzegovina', fr: 'Bosnie-Herzégovine', it: 'Bosnia ed Erzegovina', sq: 'Bosnjë dhe Hercegovinë' },
  BE: { de: 'Belgien', en: 'Belgium', fr: 'Belgique', it: 'Belgio', sq: 'Belgjikë' },
  BG: { de: 'Bulgarien', en: 'Bulgaria', fr: 'Bulgarie', it: 'Bulgaria', sq: 'Bullgari' },
  BY: { de: 'Belarus', en: 'Belarus', fr: 'Biélorussie', it: 'Bielorussia', sq: 'Bjellorusi' },
  CY: { de: 'Zypern', en: 'Cyprus', fr: 'Chypre', it: 'Cipro', sq: 'Qipro' },
  CZ: { de: 'Tschechien', en: 'Czech Republic', fr: 'Tchéquie', it: 'Repubblica Ceca', sq: 'Çeki' },
  DK: { de: 'Dänemark', en: 'Denmark', fr: 'Danemark', it: 'Danimarca', sq: 'Danimarkë' },
  EE: { de: 'Estland', en: 'Estonia', fr: 'Estonie', it: 'Estonia', sq: 'Estoni' },
  ES: { de: 'Spanien', en: 'Spain', fr: 'Espagne', it: 'Spagna', sq: 'Spanjë' },
  FI: { de: 'Finnland', en: 'Finland', fr: 'Finlande', it: 'Finlandia', sq: 'Finlandë' },
  FR: { de: 'Frankreich', en: 'France', fr: 'France', it: 'Francia', sq: 'Francë' },
  GB: { de: 'Vereinigtes Königreich', en: 'United Kingdom', fr: 'Royaume-Uni', it: 'Regno Unito', sq: 'Mbretëria e Bashkuar' },
  GE: { de: 'Georgien', en: 'Georgia', fr: 'Géorgie', it: 'Georgia', sq: 'Gjeorgji' },
  GR: { de: 'Griechenland', en: 'Greece', fr: 'Grèce', it: 'Grecia', sq: 'Greqi' },
  HR: { de: 'Kroatien', en: 'Croatia', fr: 'Croatie', it: 'Croazia', sq: 'Kroaci' },
  HU: { de: 'Ungarn', en: 'Hungary', fr: 'Hongrie', it: 'Ungheria', sq: 'Hungari' },
  IE: { de: 'Irland', en: 'Ireland', fr: 'Irlande', it: 'Irlanda', sq: 'Irlandë' },
  IS: { de: 'Island', en: 'Iceland', fr: 'Islande', it: 'Islanda', sq: 'Islandë' },
  IT: { de: 'Italien', en: 'Italy', fr: 'Italie', it: 'Italia', sq: 'Itali' },
  LT: { de: 'Litauen', en: 'Lithuania', fr: 'Lituanie', it: 'Lituania', sq: 'Lituani' },
  LU: { de: 'Luxemburg', en: 'Luxembourg', fr: 'Luxembourg', it: 'Lussemburgo', sq: 'Luksemburg' },
  LV: { de: 'Lettland', en: 'Latvia', fr: 'Lettonie', it: 'Lettonia', sq: 'Letoni' },
  MC: { de: 'Monaco', en: 'Monaco', fr: 'Monaco', it: 'Monaco', sq: 'Monako' },
  MD: { de: 'Moldawien', en: 'Moldova', fr: 'Moldavie', it: 'Moldavia', sq: 'Moldavi' },
  ME: { de: 'Montenegro', en: 'Montenegro', fr: 'Monténégro', it: 'Montenegro', sq: 'Mali i Zi' },
  MK: { de: 'Nordmazedonien', en: 'North Macedonia', fr: 'Macédoine du Nord', it: 'Macedonia del Nord', sq: 'Maqedoni' },
  MT: { de: 'Malta', en: 'Malta', fr: 'Malte', it: 'Malta', sq: 'Maltë' },
  NL: { de: 'Niederlande', en: 'Netherlands', fr: 'Pays-Bas', it: 'Paesi Bassi', sq: 'Holandë' },
  NO: { de: 'Norwegen', en: 'Norway', fr: 'Norvège', it: 'Norvegia', sq: 'Norvegji' },
  PL: { de: 'Polen', en: 'Poland', fr: 'Pologne', it: 'Polonia', sq: 'Poloni' },
  PT: { de: 'Portugal', en: 'Portugal', fr: 'Portugal', it: 'Portogallo', sq: 'Portugali' },
  RO: { de: 'Rumänien', en: 'Romania', fr: 'Roumanie', it: 'Romania', sq: 'Rumani' },
  RS: { de: 'Serbien', en: 'Serbia', fr: 'Serbie', it: 'Serbia', sq: 'Serbi' },
  RU: { de: 'Russland', en: 'Russia', fr: 'Russie', it: 'Russia', sq: 'Rusi' },
  SE: { de: 'Schweden', en: 'Sweden', fr: 'Suède', it: 'Svezia', sq: 'Suedi' },
  SI: { de: 'Slowenien', en: 'Slovenia', fr: 'Slovénie', it: 'Slovenia', sq: 'Slloveni' },
  SK: { de: 'Slowakei', en: 'Slovakia', fr: 'Slovaquie', it: 'Slovacchia', sq: 'Sllovaki' },
  SM: { de: 'San Marino', en: 'San Marino', fr: 'Saint-Marin', it: 'San Marino', sq: 'San Marino' },
  TR: { de: 'Türkei', en: 'Turkey', fr: 'Turquie', it: 'Turchia', sq: 'Turqi' },
  UA: { de: 'Ukraine', en: 'Ukraine', fr: 'Ukraine', it: 'Ucraina', sq: 'Ukrainë' },
  XK: { de: 'Kosovo', en: 'Kosovo', fr: 'Kosovo', it: 'Kosovo', sq: 'Kosovë' },
  US: { de: 'USA', en: 'USA', fr: 'États-Unis', it: 'Stati Uniti', sq: 'SHBA' },
};

function getCountryName(code: string, locale: string): string {
  return COUNTRY_NAMES[code]?.[locale] || COUNTRY_NAMES[code]?.en || code;
}

const COUNTRY_CODES = COUNTRIES.map(c => ({ ...c, name: '' }));

function parsePhone(value: string): { dial: string; number: string } {
  const trimmed = value.trim();
  if (!trimmed.startsWith('+')) return { dial: '+41', number: trimmed };
  // Find the longest matching dial code
  let bestMatch = '';
  for (const c of COUNTRY_CODES) {
    if (trimmed.startsWith(c.dial) && c.dial.length > bestMatch.length) {
      bestMatch = c.dial;
    }
  }
  if (bestMatch) {
    return { dial: bestMatch, number: trimmed.slice(bestMatch.length).trim() };
  }
  return { dial: '+41', number: trimmed };
}

interface PhoneInputProps {
  value: string;
  onChange: (fullValue: string) => void;
  placeholder?: string;
  className?: string;
  errorClassName?: string;
  hasError?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = '79 123 45 67',
  className = '',
  errorClassName = '',
  hasError = false,
}: PhoneInputProps) {
  const locale = useLocale();
  const parsed = parsePhone(value);
  const [selectedDial, setSelectedDial] = useState(parsed.dial);
  const [localNumber, setLocalNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Sync from external value on first mount or when value changes externally
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const p = parsePhone(value);
      setSelectedDial(p.dial);
      setLocalNumber(p.number);
      return;
    }
    // Only sync if the external value is substantially different
    const full = `${selectedDial} ${localNumber}`.trim();
    if (value !== full) {
      const p = parsePhone(value);
      setSelectedDial(p.dial);
      setLocalNumber(p.number);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDialSelect = useCallback((dial: string) => {
    setSelectedDial(dial);
    setOpen(false);
    onChange(`${dial} ${localNumber}`.trim());
  }, [localNumber, onChange]);

  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value;
    // Only allow digits and spaces
    if (num !== '' && !/^[\d\s]*$/.test(num)) return;
    setLocalNumber(num);
    onChange(`${selectedDial} ${num}`.trim());
  }, [selectedDial, onChange]);

  const selectedCountry = COUNTRY_CODES.find(c => c.dial === selectedDial) || COUNTRY_CODES[0];

  return (
    <div ref={wrapperRef} className="relative flex">
      {/* Country code selector */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center gap-1.5 px-3 rounded-l-lg sm:rounded-l-xl border border-r-0 text-[13px] font-semibold transition-all shrink-0',
          hasError
            ? 'border-red-300 bg-red-50/50'
            : 'border-slate-200/80 bg-slate-50/80 hover:bg-slate-100'
        )}
      >
        <img
          src={`https://flagcdn.com/20x15/${selectedCountry.code.toLowerCase()}.png`}
          alt={selectedCountry.code}
          className="w-5 h-[15px] rounded-[2px] object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="text-slate-700">{selectedDial}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className={clsx(
          'flex-1 min-w-0 !rounded-l-none !rounded-r-lg sm:!rounded-r-xl border',
          hasError ? errorClassName : className
        )}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-[280px] overflow-y-auto">
          {COUNTRY_CODES.map((c) => (
            <button
              key={c.code}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleDialSelect(c.dial); }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors text-[13px] hover:bg-slate-50',
                c.dial === selectedDial && 'bg-slate-50'
              )}
            >
              <img
                src={`https://flagcdn.com/20x15/${c.code.toLowerCase()}.png`}
                alt={c.code}
                className="w-5 h-[15px] rounded-[2px] object-cover shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="font-semibold text-slate-800">{getCountryName(c.code, locale)}</span>
              <span className="ml-auto text-slate-400 font-medium">{c.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
