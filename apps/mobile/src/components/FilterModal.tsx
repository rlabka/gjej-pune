import { useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Search as SearchIcon,
  Sparkles,
  X,
} from 'lucide-react-native';
import { JOB_CATEGORIES, type Locale } from '@jmp/shared';
import { useI18n } from '@/contexts/I18nContext';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

export type FilterValues = {
  categories: string[];
  location: string;
  radius: number; // km, 0 = unlimited
  sort: 'relevance' | 'date';
  experience: string;
  when: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (values: FilterValues) => void;
  mode: 'jobs' | 'ads';
  initial: FilterValues;
};

const MAX_DISTANCE = 200; // km

export function FilterModal({ visible, onClose, onApply, mode, initial }: Props) {
  const { t, locale } = useI18n();
  const l = (locale as Locale) ?? 'de';

  const [categories, setCategories] = useState<string[]>(initial.categories);
  const [location, setLocation] = useState(initial.location);
  const [radius, setRadius] = useState(initial.radius);
  const [sort, setSort] = useState(initial.sort);
  const [experience, setExperience] = useState(initial.experience);
  const [when, setWhen] = useState(initial.when);

  const [search, setSearch] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openSort, setOpenSort] = useState(false);
  const [openExp, setOpenExp] = useState(false);
  const [openAvail, setOpenAvail] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return JOB_CATEGORIES;
    const q = search.toLowerCase();
    return JOB_CATEGORIES.map((g) => {
      const label = g.labels[l]?.toLowerCase() ?? '';
      const matchGroup = label.includes(q);
      const matchTitles = g.titles.filter((ti) =>
        (ti.labels[l] ?? ti.key).toLowerCase().includes(q)
      );
      if (matchGroup) return g;
      if (matchTitles.length > 0) return { ...g, titles: matchTitles };
      return null;
    }).filter((g): g is typeof JOB_CATEGORIES[number] => !!g);
  }, [search, l]);

  function toggleCategory(key: string) {
    setCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function reset() {
    setCategories([]);
    setLocation('');
    setRadius(100);
    setSort('relevance');
    setExperience('');
    setWhen('');
    setSearch('');
  }

  function apply() {
    onApply({ categories, location, radius, sort, experience, when });
    onClose();
  }

  const expOptions = [
    { value: 'none', label: t('Mobile.browse.filterExpNone') },
    { value: 'basic', label: t('Mobile.browse.filterExpBasic') },
    { value: 'experienced', label: t('Mobile.browse.filterExpExperienced') },
    { value: 'senior', label: t('Mobile.browse.filterExpSenior') },
    { value: 'expert', label: t('Mobile.browse.filterExpExpert') },
  ];

  const availOptions = [
    { value: 'Urgent', label: t('Mobile.browse.filterAvailUrgent') },
    { value: 'Negotiation', label: t('Mobile.browse.filterAvailNegotiation') },
  ];

  const sortOptions: { value: 'relevance' | 'date'; label: string }[] = [
    { value: 'relevance', label: t('Mobile.browse.filterSortRelevance') },
    { value: 'date', label: t('Mobile.browse.filterSortNewest') },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
          <Text className="text-xl font-extrabold text-[#0B1F44]">
            {t('Mobile.browse.filterTitle')}
          </Text>
          <Pressable
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100 active:opacity-70"
          >
            <X color="#0B1F44" size={18} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Beruf */}
          <View className="px-5 pt-5">
            <Text className="mb-3 text-[15px] font-extrabold text-[#0B1F44]">
              {t('Mobile.browse.filterProfession')}
            </Text>

            <View className="mb-3 flex-row items-center rounded-xl bg-slate-100 px-3">
              <SearchIcon color="#94A3B8" size={15} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('Mobile.browse.filterProfessionSearch')}
                placeholderTextColor="#94A3B8"
                className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
              />
            </View>

            <View style={{ gap: 8 }}>
              {filteredGroups.map((g) => {
                const isOpen = openGroup === g.slug;
                const groupLabel = g.labels[l] ?? g.labels.de;
                const selectedCount = g.titles.filter((ti) =>
                  categories.includes(ti.key)
                ).length;

                return (
                  <View key={g.slug}>
                    <Pressable
                      onPress={() => setOpenGroup(isOpen ? null : g.slug)}
                      className={`flex-row items-center justify-between rounded-xl px-3 py-3 active:opacity-80 ${
                        selectedCount > 0 ? 'bg-[#FFF4CC]' : 'bg-[#FFF9E1]'
                      }`}
                    >
                      <View className="flex-1 flex-row items-center">
                        <Text className="mr-2 text-[16px]">{g.icon}</Text>
                        <Text
                          className="flex-1 text-[13px] font-bold text-[#0B1F44]"
                          numberOfLines={1}
                        >
                          {groupLabel}
                        </Text>
                        {selectedCount > 0 ? (
                          <View className="mx-2 h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0B1F44] px-1.5">
                            <Text className="text-[10px] font-extrabold text-[#F5C400]">
                              {selectedCount}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {isOpen ? (
                        <ChevronUp color="#94A3B8" size={16} />
                      ) : (
                        <ChevronDown color="#94A3B8" size={16} />
                      )}
                    </Pressable>

                    {isOpen ? (
                      <View className="mt-1 rounded-xl bg-white">
                        {g.titles.map((ti, tidx) => {
                          const label = ti.labels[l] ?? ti.key;
                          const checked = categories.includes(ti.key);
                          return (
                            <Pressable
                              key={ti.key}
                              onPress={() => toggleCategory(ti.key)}
                              className={`flex-row items-center px-4 py-2.5 ${
                                tidx < g.titles.length - 1
                                  ? 'border-b border-slate-50'
                                  : ''
                              } ${checked ? 'bg-[#162C66]/5' : ''}`}
                            >
                              <View
                                className={`mr-3 h-5 w-5 items-center justify-center rounded-md border-2 ${
                                  checked
                                    ? 'border-[#162C66] bg-[#162C66]'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {checked ? (
                                  <Check color="#FFFFFF" size={12} strokeWidth={3.5} />
                                ) : null}
                              </View>
                              <Text
                                className={`flex-1 text-[13px] ${checked ? 'font-bold text-[#0B1F44]' : 'text-slate-600'}`}
                                numberOfLines={2}
                              >
                                {label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Stadt / Region */}
          <View className="mt-6 px-5">
            <Text className="mb-2.5 text-[15px] font-extrabold text-[#0B1F44]">
              {t('Mobile.browse.filterLocation')}
            </Text>
            <LocationAutocomplete
              value={location}
              onChangeText={setLocation}
              placeholder={t('Mobile.browse.filterLocation')}
              variant="light"
            />
          </View>

          {/* Max. Entfernung */}
          <View className="mt-6 px-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[15px] font-extrabold text-[#0B1F44]">
                {t('Mobile.browse.filterMaxDistance')}
              </Text>
              <Text className="text-[13px] font-semibold text-slate-500">
                {radius === 0
                  ? t('Mobile.browse.filterDistanceUnlimited')
                  : `${radius} km`}
              </Text>
            </View>
            <DistanceSlider
              value={radius}
              max={MAX_DISTANCE}
              onChange={setRadius}
            />
          </View>

          {/* Sortierung */}
          <CollapseSection
            title={t('Mobile.browse.filterSort')}
            open={openSort}
            onToggle={() => setOpenSort((v) => !v)}
          >
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {sortOptions.map((o) => {
                const active = sort === o.value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => setSort(o.value)}
                    className={`flex-row items-center rounded-xl px-3 py-2 active:opacity-80 ${
                      active
                        ? 'bg-[#0B1F44]'
                        : 'border border-slate-200 bg-white'
                    }`}
                  >
                    {o.value === 'relevance' ? (
                      <Sparkles
                        color={active ? '#F5C400' : '#0B1F44'}
                        size={12}
                      />
                    ) : (
                      <Calendar
                        color={active ? '#F5C400' : '#0B1F44'}
                        size={12}
                      />
                    )}
                    <Text
                      className={`ml-1.5 text-[12px] font-bold ${
                        active ? 'text-white' : 'text-[#0B1F44]'
                      }`}
                    >
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </CollapseSection>

          {/* Erfahrung (ads mode) */}
          {mode === 'ads' ? (
            <CollapseSection
              title={t('Mobile.browse.filterExperience')}
              open={openExp}
              onToggle={() => setOpenExp((v) => !v)}
            >
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {expOptions.map((o) => {
                  const active = experience === o.value;
                  return (
                    <Pressable
                      key={o.value}
                      onPress={() =>
                        setExperience(active ? '' : o.value)
                      }
                      className={`rounded-xl px-3 py-2 active:opacity-80 ${
                        active
                          ? 'bg-[#0B1F44]'
                          : 'border border-slate-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-bold ${
                          active ? 'text-white' : 'text-[#0B1F44]'
                        }`}
                      >
                        {o.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </CollapseSection>
          ) : null}

          {/* Verfügbarkeit (jobs mode) */}
          {mode === 'jobs' ? (
            <CollapseSection
              title={t('Mobile.browse.filterAvailability')}
              open={openAvail}
              onToggle={() => setOpenAvail((v) => !v)}
            >
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {availOptions.map((o) => {
                  const active = when === o.value;
                  return (
                    <Pressable
                      key={o.value}
                      onPress={() => setWhen(active ? '' : o.value)}
                      className={`rounded-xl px-3 py-2 active:opacity-80 ${
                        active
                          ? 'bg-[#0B1F44]'
                          : 'border border-slate-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-bold ${
                          active ? 'text-white' : 'text-[#0B1F44]'
                        }`}
                      >
                        {o.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </CollapseSection>
          ) : null}

          {/* Reset */}
          <View className="mt-6 items-center px-5">
            <Pressable
              onPress={reset}
              className="rounded-xl border border-slate-200 px-4 py-2 active:opacity-80"
            >
              <Text className="text-[12px] font-bold text-slate-600">
                {t('Mobile.browse.filterReset')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Search button (fixed bottom) */}
        <View className="border-t border-slate-100 bg-white px-5 py-3">
          <Pressable
            onPress={apply}
            className="items-center rounded-xl bg-[#0B1F44] py-4 active:opacity-90"
          >
            <Text className="text-[15px] font-extrabold text-white">
              {t('Mobile.browse.searchButton')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function CollapseSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4 border-t border-slate-100 px-5 pt-4">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between active:opacity-70"
      >
        <Text className="text-[15px] font-extrabold text-[#0B1F44]">{title}</Text>
        {open ? (
          <ChevronUp color="#94A3B8" size={18} />
        ) : (
          <ChevronDown color="#94A3B8" size={18} />
        )}
      </Pressable>
      {open ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}

function DistanceSlider({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startXRef = useRef(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    widthRef.current = w;
  };

  const pctToVal = (pct: number) =>
    Math.round((pct * max) / 5) * 5;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const w = widthRef.current;
        if (w <= 0) return;
        const x = Math.max(0, Math.min(w, e.nativeEvent.locationX));
        startXRef.current = x;
        onChange(pctToVal(x / w));
      },
      onPanResponderMove: (_e, gs) => {
        const w = widthRef.current;
        if (w <= 0) return;
        const x = Math.max(0, Math.min(w, startXRef.current + gs.dx));
        onChange(pctToVal(x / w));
      },
    })
  ).current;

  const pct = width > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const thumbX = pct * width;

  return (
    <View
      className="h-8 justify-center"
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      <View className="h-1 rounded-full bg-slate-200">
        <View
          className="h-1 rounded-full bg-[#162C66]"
          style={{ width: thumbX }}
        />
      </View>
      <View
        pointerEvents="none"
        className="absolute h-5 w-5 rounded-full border-2 border-[#162C66] bg-white"
        style={{
          left: Math.max(0, thumbX - 10),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </View>
  );
}
