import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search as SearchIcon, X } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

type Currency = {
  code: string;
  symbol: string;
  flag: string;
  name: Record<Locale, string>;
};

const CURRENCIES: Currency[] = [
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

type Props = {
  value: string;
  onChange: (code: string) => void;
};

export function CurrencySelect({ value, onChange }: Props) {
  const { locale, t } = useI18n();
  const loc: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(locale as Locale)
    ? (locale as Locale)
    : 'en';

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0],
    [value]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter((c) => {
      return (
        c.code.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.name[loc].toLowerCase().includes(q)
      );
    });
  }, [search, loc]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="h-[46px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 active:opacity-80"
        style={{ minWidth: 110 }}
      >
        <Text className="text-[16px]" style={{ lineHeight: 18 }}>
          {selected.flag}
        </Text>
        <Text className="ml-2 text-[14px] font-bold text-[#0B1F44]">
          {selected.code}
        </Text>
        <Text className="ml-1.5 text-[12px] font-medium text-slate-400">
          {selected.symbol}
        </Text>
        <View className="ml-auto pl-1">
          <ChevronDown color="#94A3B8" size={14} />
        </View>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/40"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0"
            style={{ maxHeight: '78%' }}
          >
            <SafeAreaView edges={['bottom']} className="bg-white rounded-t-3xl">
              {/* Handle */}
              <View className="items-center pt-3">
                <View className="h-1 w-10 rounded-full bg-slate-200" />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between px-5 py-3">
                <Text className="text-[18px] font-extrabold text-[#0B1F44]">
                  {t('Mobile.jobForm.currency')}
                </Text>
                <Pressable
                  onPress={() => setOpen(false)}
                  className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100 active:opacity-70"
                >
                  <X color="#0B1F44" size={18} />
                </Pressable>
              </View>

              {/* Search */}
              <View className="px-5 pb-3">
                <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <SearchIcon color="#94A3B8" size={15} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t('Mobile.common.search')}
                    placeholderTextColor="#94A3B8"
                    className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {search ? (
                    <Pressable onPress={() => setSearch('')} className="p-1">
                      <X color="#94A3B8" size={14} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* List */}
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.code}
                ItemSeparatorComponent={() => (
                  <View className="ml-14 h-px bg-slate-100" />
                )}
                contentContainerStyle={{ paddingBottom: 12 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const active = item.code === value;
                  return (
                    <Pressable
                      onPress={() => {
                        onChange(item.code);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`flex-row items-center px-5 py-3 active:bg-slate-50 ${
                        active ? 'bg-[#162C66]/5' : ''
                      }`}
                    >
                      <Text className="text-[20px]" style={{ lineHeight: 22 }}>
                        {item.flag}
                      </Text>
                      <View className="ml-3 w-12">
                        <Text
                          className={`text-[14px] font-extrabold ${
                            active ? 'text-[#162C66]' : 'text-[#0B1F44]'
                          }`}
                        >
                          {item.code}
                        </Text>
                      </View>
                      <Text
                        className="flex-1 text-[13px] font-medium text-slate-500"
                        numberOfLines={1}
                      >
                        {item.name[loc]}
                      </Text>
                      <Text className="ml-2 text-[13px] font-bold text-slate-400">
                        {item.symbol}
                      </Text>
                      {active ? (
                        <View className="ml-2">
                          <Check color="#162C66" size={16} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View className="items-center py-10">
                    <Text className="text-[13px] text-slate-400">
                      {t('Mobile.common.noResults')}
                    </Text>
                  </View>
                }
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
