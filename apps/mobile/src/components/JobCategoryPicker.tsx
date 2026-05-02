import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronRight, ChevronUp, Search as SearchIcon, X } from 'lucide-react-native';
import { JOB_CATEGORIES, type Locale } from '@jmp/shared';
import { useI18n } from '@/contexts/I18nContext';

type Props = {
  /** Currently selected job-title key (Albanian key). */
  value: string;
  onChange: (key: string) => void;
  placeholder?: string;
  hasError?: boolean;
};

export function JobCategoryPicker({
  value,
  onChange,
  placeholder,
  hasError,
}: Props) {
  const { t, locale } = useI18n();
  const l = (locale as Locale) ?? 'de';
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Resolve label for the selected key
  const selectedLabel = useMemo(() => {
    if (!value) return '';
    for (const g of JOB_CATEGORIES) {
      const found = g.titles.find((ti) => ti.key === value);
      if (found) return found.labels[l] ?? found.key;
    }
    return value;
  }, [value, l]);

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
    }).filter((g): g is (typeof JOB_CATEGORIES)[number] => !!g);
  }, [search, l]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${
          hasError
            ? 'border-red-300 bg-red-50/50'
            : 'border-slate-200 bg-slate-50'
        }`}
      >
        <Text
          className={`flex-1 text-[15px] ${
            selectedLabel
              ? 'font-medium text-slate-900'
              : 'text-slate-400'
          }`}
          numberOfLines={1}
        >
          {selectedLabel || placeholder || t('Mobile.jobForm.selectCategory')}
        </Text>
        <ChevronRight color="#94A3B8" size={16} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
          <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-4">
            <Text className="text-xl font-extrabold text-[#0B1F44]">
              {t('Mobile.jobForm.category')}
            </Text>
            <Pressable
              onPress={() => setOpen(false)}
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
            <View className="px-5 pt-4">
              <View className="mb-3 flex-row items-center rounded-xl bg-slate-100 px-3">
                <SearchIcon color="#94A3B8" size={15} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t('Mobile.jobForm.categorySearch')}
                  placeholderTextColor="#94A3B8"
                  className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
                />
              </View>

              <View style={{ gap: 8 }}>
                {filteredGroups.map((g) => {
                  const isOpen = openGroup === g.slug;
                  const groupLabel = g.labels[l] ?? g.labels.de;
                  const selectedInGroup = g.titles.some((ti) => ti.key === value);

                  return (
                    <View key={g.slug}>
                      <Pressable
                        onPress={() => setOpenGroup(isOpen ? null : g.slug)}
                        className={`flex-row items-center justify-between rounded-xl px-3 py-3 active:opacity-80 ${
                          selectedInGroup ? 'bg-[#FFF4CC]' : 'bg-[#FFF9E1]'
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
                        </View>
                        {isOpen ? (
                          <ChevronUp color="#94A3B8" size={16} />
                        ) : (
                          <ChevronDown color="#94A3B8" size={16} />
                        )}
                      </Pressable>

                      {isOpen ? (
                        <View className="mt-1 rounded-xl bg-white">
                          {g.titles.map((ti, idx) => {
                            const label = ti.labels[l] ?? ti.key;
                            const active = value === ti.key;
                            return (
                              <Pressable
                                key={ti.key}
                                onPress={() => {
                                  onChange(ti.key);
                                  setOpen(false);
                                }}
                                className={`px-4 py-2.5 ${
                                  idx < g.titles.length - 1
                                    ? 'border-b border-slate-50'
                                    : ''
                                } ${active ? 'bg-[#162C66]/5' : ''}`}
                              >
                                <Text
                                  className={`text-[13px] ${
                                    active
                                      ? 'font-bold text-[#162C66]'
                                      : 'text-slate-700'
                                  }`}
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
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
