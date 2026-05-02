'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const CURRENCIES = [
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: { de: 'Euro', en: 'Euro', fr: 'Euro', it: 'Euro', sq: 'Euro' } },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', name: { de: 'Schweizer Franken', en: 'Swiss Franc', fr: 'Franc suisse', it: 'Franco svizzero', sq: 'Franga zvicerane' } },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: { de: 'Britisches Pfund', en: 'British Pound', fr: 'Livre sterling', it: 'Sterlina britannica', sq: 'Sterlina britanike' } },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: { de: 'US-Dollar', en: 'US Dollar', fr: 'Dollar américain', it: 'Dollaro americano', sq: 'Dollari amerikan' } },
  { code: 'ALL', symbol: 'L', flag: '🇦🇱', name: { de: 'Albanischer Lek', en: 'Albanian Lek', fr: 'Lek albanais', it: 'Lek albanese', sq: 'Leku shqiptar' } },
  { code: 'BAM', symbol: 'KM', flag: '🇧🇦', name: { de: 'Konvertible Mark', en: 'Bosnian Mark', fr: 'Mark convertible', it: 'Marco convertibile', sq: 'Marka bosanjake' } },
  { code: 'BGN', symbol: 'лв', flag: '🇧🇬', name: { de: 'Bulgarischer Lew', en: 'Bulgarian Lev', fr: 'Lev bulgare', it: 'Lev bulgaro', sq: 'Leva bullgare' } },
  { code: 'BYN', symbol: 'Br', flag: '🇧🇾', name: { de: 'Belarussischer Rubel', en: 'Belarusian Ruble', fr: 'Rouble biélorusse', it: 'Rublo bielorusso', sq: 'Rubla bjelloruse' } },
  { code: 'CZK', symbol: 'Kč', flag: '🇨🇿', name: { de: 'Tschechische Krone', en: 'Czech Koruna', fr: 'Couronne tchèque', it: 'Corona ceca', sq: 'Koruna çeke' } },
  { code: 'DKK', symbol: 'kr', flag: '🇩🇰', name: { de: 'Dänische Krone', en: 'Danish Krone', fr: 'Couronne danoise', it: 'Corona danese', sq: 'Korona daneze' } },
  { code: 'GEL', symbol: '₾', flag: '🇬🇪', name: { de: 'Georgischer Lari', en: 'Georgian Lari', fr: 'Lari géorgien', it: 'Lari georgiano', sq: 'Lari gjeorgjian' } },
  { code: 'HUF', symbol: 'Ft', flag: '🇭🇺', name: { de: 'Ungarischer Forint', en: 'Hungarian Forint', fr: 'Forint hongrois', it: 'Fiorino ungherese', sq: 'Forinta hungareze' } },
  { code: 'ISK', symbol: 'kr', flag: '🇮🇸', name: { de: 'Isländische Krone', en: 'Icelandic Króna', fr: 'Couronne islandaise', it: 'Corona islandese', sq: 'Korona islandeze' } },
  { code: 'MDL', symbol: 'L', flag: '🇲🇩', name: { de: 'Moldauischer Leu', en: 'Moldovan Leu', fr: 'Leu moldave', it: 'Leu moldavo', sq: 'Leu moldav' } },
  { code: 'MKD', symbol: 'ден', flag: '🇲🇰', name: { de: 'Mazedonischer Denar', en: 'Macedonian Denar', fr: 'Denar macédonien', it: 'Dinaro macedone', sq: 'Denari maqedonas' } },
  { code: 'NOK', symbol: 'kr', flag: '🇳🇴', name: { de: 'Norwegische Krone', en: 'Norwegian Krone', fr: 'Couronne norvégienne', it: 'Corona norvegese', sq: 'Korona norvegjeze' } },
  { code: 'PLN', symbol: 'zł', flag: '🇵🇱', name: { de: 'Polnischer Zloty', en: 'Polish Zloty', fr: 'Zloty polonais', it: 'Zloty polacco', sq: 'Zllota polake' } },
  { code: 'RON', symbol: 'lei', flag: '🇷🇴', name: { de: 'Rumänischer Leu', en: 'Romanian Leu', fr: 'Leu roumain', it: 'Leu romeno', sq: 'Leu rumun' } },
  { code: 'RSD', symbol: 'din', flag: '🇷🇸', name: { de: 'Serbischer Dinar', en: 'Serbian Dinar', fr: 'Dinar serbe', it: 'Dinaro serbo', sq: 'Dinari serb' } },
  { code: 'SEK', symbol: 'kr', flag: '🇸🇪', name: { de: 'Schwedische Krone', en: 'Swedish Krona', fr: 'Couronne suédoise', it: 'Corona svedese', sq: 'Korona suedeze' } },
  { code: 'TRY', symbol: '₺', flag: '🇹🇷', name: { de: 'Türkische Lira', en: 'Turkish Lira', fr: 'Livre turque', it: 'Lira turca', sq: 'Lira turke' } },
  { code: 'UAH', symbol: '₴', flag: '🇺🇦', name: { de: 'Ukrainische Hrywnja', en: 'Ukrainian Hryvnia', fr: 'Hryvnia ukrainienne', it: 'Grivnia ucraina', sq: 'Hryvnia ukrainase' } },
];

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

interface Props {
  value: string;
  onChange: (code: string) => void;
  locale?: string;
  compact?: boolean;
}

export default function CurrencySelect({ value, onChange, locale = 'de', compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const loc = (locale as Locale) in (CURRENCIES[0].name) ? (locale as Locale) : 'en';
  const selected = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center gap-2 border transition-all font-semibold',
          compact ? 'px-3 py-2.5 rounded-lg text-[13px] min-w-[100px]' : 'px-3.5 py-3 rounded-xl text-[14px] min-w-[110px]',
          open
            ? 'bg-white border-[#162C66]/30 ring-2 ring-[#162C66]/10'
            : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
        )}
      >
        <span className="text-[16px] leading-none">{selected.flag}</span>
        <span className="text-slate-800">{selected.code}</span>
        <span className="text-slate-400 text-[13px]">{selected.symbol}</span>
        <ChevronDown size={14} className={clsx('text-slate-400 ml-auto transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[260px] bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-[280px] overflow-y-auto py-1">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(c.code); setOpen(false); }}
              className={clsx(
                'w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors',
                c.code === value
                  ? 'bg-[#162C66]/[0.04] text-[#162C66]'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              <span className="text-[16px] leading-none">{c.flag}</span>
              <span className="text-[13px] font-bold min-w-[36px]">{c.code}</span>
              <span className="text-[12px] text-slate-400 font-medium truncate">{c.name[loc]}</span>
              <span className="text-[13px] text-slate-400 font-semibold ml-auto">{c.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
