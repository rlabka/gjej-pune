import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, X } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

const COUNTRIES = [
  // DACH first
  { code: 'CH', dial: '+41' },
  { code: 'DE', dial: '+49' },
  { code: 'AT', dial: '+43' },
  { code: 'LI', dial: '+423' },
  // Europe alphabetical
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
  // Outside Europe
  { code: 'US', dial: '+1' },
] as const;

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

function countryName(code: string, locale: string): string {
  return COUNTRY_NAMES[code]?.[locale] || COUNTRY_NAMES[code]?.en || code;
}

function parsePhone(value: string): { dial: string; number: string } {
  const trimmed = value.trim();
  if (!trimmed.startsWith('+')) return { dial: '+41', number: trimmed };
  let bestMatch = '';
  for (const c of COUNTRIES) {
    if (trimmed.startsWith(c.dial) && c.dial.length > bestMatch.length) {
      bestMatch = c.dial;
    }
  }
  if (bestMatch) {
    return { dial: bestMatch, number: trimmed.slice(bestMatch.length).trim() };
  }
  return { dial: '+41', number: trimmed };
}

type Props = {
  value: string;
  onChange: (fullValue: string) => void;
  placeholder?: string;
  hasError?: boolean;
};

export function PhoneInput({
  value,
  onChange,
  placeholder = '79 123 45 67',
  hasError,
}: Props) {
  const { locale } = useI18n();
  const parsed = parsePhone(value);
  const [selectedDial, setSelectedDial] = useState(parsed.dial);
  const [localNumber, setLocalNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const p = parsePhone(value);
      setSelectedDial(p.dial);
      setLocalNumber(p.number);
      return;
    }
    const full = `${selectedDial} ${localNumber}`.trim();
    if (value !== full) {
      const p = parsePhone(value);
      setSelectedDial(p.dial);
      setLocalNumber(p.number);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onDialPick = (dial: string) => {
    setSelectedDial(dial);
    setOpen(false);
    onChange(`${dial} ${localNumber}`.trim());
  };

  const onNumberChange = (num: string) => {
    if (num !== '' && !/^[\d\s]*$/.test(num)) return;
    setLocalNumber(num);
    onChange(`${selectedDial} ${num}`.trim());
  };

  const selected = COUNTRIES.find((c) => c.dial === selectedDial) ?? COUNTRIES[0];

  return (
    <View className="flex-row" style={{ gap: 0 }}>
      {/* Country selector button */}
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center rounded-l-xl border border-r-0 px-3 ${
          hasError ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-slate-50'
        }`}
        style={{ gap: 6 }}
      >
        <Image
          source={{ uri: `https://flagcdn.com/20x15/${selected.code.toLowerCase()}.png` }}
          style={{ width: 20, height: 15, borderRadius: 2 }}
        />
        <Text className="text-[13px] font-semibold text-slate-700">{selectedDial}</Text>
        <ChevronDown color="#94A3B8" size={12} />
      </Pressable>

      {/* Number input */}
      <TextInput
        value={localNumber}
        onChangeText={onNumberChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType="phone-pad"
        className={`flex-1 rounded-r-xl border px-4 py-3 text-[15px] font-medium text-slate-900 ${
          hasError ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-slate-50'
        }`}
      />

      {/* Country picker modal */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="flex-row items-center border-b border-slate-200 px-4 py-3">
            <Text className="flex-1 text-base font-bold text-[#0B1F44]">
              {countryName(selected.code, locale)}
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
              className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
            >
              <X color="#0B1F44" size={20} />
            </Pressable>
          </View>
          <ScrollView className="flex-1">
            {COUNTRIES.map((c) => {
              const isActive = c.dial === selectedDial;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => onDialPick(c.dial)}
                  className={`flex-row items-center border-b border-slate-100 px-4 py-3.5 ${
                    isActive ? 'bg-slate-50' : ''
                  }`}
                  style={{ gap: 12 }}
                >
                  <Image
                    source={{ uri: `https://flagcdn.com/20x15/${c.code.toLowerCase()}.png` }}
                    style={{ width: 22, height: 16, borderRadius: 2 }}
                  />
                  <Text className="flex-1 text-[14px] font-semibold text-slate-800">
                    {countryName(c.code, locale)}
                  </Text>
                  <Text className="text-[13px] font-medium text-slate-400">{c.dial}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
