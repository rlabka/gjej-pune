import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Search as SearchIcon,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { JobCard, type JobItem } from '@/components/JobCard';
import { AdCard, type AdItem } from '@/components/AdCard';
import { FilterModal, type FilterValues } from '@/components/FilterModal';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

type Mode = 'jobs' | 'ads';
type JobsResponse = { ok: boolean; jobs: JobItem[]; total: number; totalPages: number };
type AdsResponse = { ok: boolean; ads: AdItem[]; total: number; totalPages: number };

const PAGE_SIZE = 20;

export default function BrowseScreen() {
  const { t } = useI18n();
  const { session } = useAuth();
  const isEmployer = session?.role === 'employer';
  const mode: Mode = isEmployer ? 'ads' : 'jobs';

  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    categories: [],
    location: '',
    radius: 100,
    sort: 'relevance',
    experience: '',
    when: '',
  });

  const activeFilterCount =
    (filters.categories.length > 0 ? 1 : 0) +
    [filters.location, filters.experience, filters.when].filter(Boolean).length +
    (filters.sort !== 'relevance' ? 1 : 0) +
    (filters.radius !== 100 ? 1 : 0);

  const fetchPage = useCallback(
    async (p: number, append: boolean) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {
          page: String(p),
          limit: String(PAGE_SIZE),
        };
        const kw = query.trim();
        if (kw) params.keyword = kw;
        if (filters.location.trim()) params.location = filters.location.trim();
        if (filters.categories.length > 0) {
          params.category = filters.categories.join(',');
        }
        if (filters.sort) params.sort = filters.sort;
        if (filters.radius > 0 && filters.radius < 200) {
          params.radius = String(filters.radius);
        }

        if (mode === 'jobs') {
          if (filters.when) params.when = filters.when;
          const qs = new URLSearchParams(params).toString();
          const res = await api.get<JobsResponse>(`/api/jobs?${qs}`);
          if (!res?.ok) throw new Error('fetch failed');
          setTotal(res.total);
          setTotalPages(res.totalPages);
          setJobs((prev) => (append ? [...prev, ...res.jobs] : res.jobs));
        } else {
          const qs = new URLSearchParams(params).toString();
          const res = await api.get<AdsResponse>(`/api/ads?${qs}`);
          if (!res?.ok) throw new Error('fetch failed');
          setTotal(res.total);
          setTotalPages(res.totalPages);
          setAds((prev) => (append ? [...prev, ...res.ads] : res.ads));
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode, query, filters]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      fetchPage(1, false);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, query, filters]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPage(1, false);
  };

  const onEndReached = () => {
    if (loading || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  };

  const data = mode === 'jobs' ? jobs : ads;

  const resultsTitle =
    mode === 'ads'
      ? t('Mobile.browse.candidatesFound', { count: total })
      : t('Mobile.browse.jobsFound', { count: total });

  const resultsSubtitle =
    mode === 'ads'
      ? t('Mobile.browse.candidatesSubtitle')
      : t('Mobile.browse.jobsSubtitle');

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="flex-1">
        <FlatList
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          data={data as any[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            mode === 'jobs' ? (
              <View className="px-6">
                <JobCard item={item as JobItem} />
              </View>
            ) : (
              <View className="px-6">
                <AdCard item={item as AdItem} />
              </View>
            )
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#162C66"
            />
          }
          ListHeaderComponent={
            <View>
              {/* Dark navy search panel */}
              <View className="px-4 pt-3">
                <View className="rounded-2xl bg-[#162C66] p-4">
                  <View className="mb-2.5 flex-row items-center rounded-xl bg-white/[0.08] px-3">
                    <SearchIcon color="rgba(255,255,255,0.5)" size={16} />
                    <TextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder={t('Mobile.browse.searchTitlePlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      className="ml-2 flex-1 py-3.5 text-[14px] text-white"
                      returnKeyType="search"
                    />
                  </View>

                  <View className="mb-3">
                    <LocationAutocomplete
                      value={filters.location}
                      onChangeText={(v) =>
                        setFilters((f) => ({ ...f, location: v }))
                      }
                      placeholder={t('Mobile.browse.searchLocationPlaceholder')}
                      variant="dark"
                    />
                  </View>

                  <Pressable
                    onPress={() => {
                      setPage(1);
                      fetchPage(1, false);
                    }}
                    className="flex-row items-center justify-center rounded-xl bg-[#F5C400] py-3.5 active:opacity-90"
                  >
                    <SearchIcon color="#0B1F44" size={16} />
                    <Text className="ml-2 text-[15px] font-extrabold text-[#0B1F44]">
                      {t('Mobile.browse.searchButton')}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Results header */}
              <View className="mt-5 px-6">
                <Text className="text-[22px] font-extrabold text-[#0B1F44]">
                  {resultsTitle}
                </Text>
                <Text className="mt-1 text-[13px] text-slate-500">
                  {resultsSubtitle}
                </Text>
              </View>

              {/* Filter chips */}
              <View className="mt-3 flex-row px-6">
                <Pressable
                  onPress={() => setShowFilters(true)}
                  className="mr-2 flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:opacity-80"
                >
                  <SlidersHorizontal color="#0B1F44" size={14} />
                  <Text className="ml-1.5 text-[13px] font-bold text-[#0B1F44]">
                    {t('Mobile.browse.filter')}
                  </Text>
                  {activeFilterCount > 0 ? (
                    <View className="ml-1.5 h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F5C400] px-1">
                      <Text className="text-[10px] font-extrabold text-[#0B1F44]">
                        {activeFilterCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>

                <Pressable
                  onPress={() =>
                    setFilters((f) => ({ ...f, sort: 'relevance' }))
                  }
                  className={`mr-2 flex-row items-center rounded-xl px-3.5 py-2 active:opacity-80 ${
                    filters.sort === 'relevance'
                      ? 'bg-[#0B1F44]'
                      : 'border border-slate-200 bg-white'
                  }`}
                >
                  <Sparkles
                    color={filters.sort === 'relevance' ? '#F5C400' : '#0B1F44'}
                    size={13}
                  />
                  <Text
                    className={`ml-1.5 text-[13px] font-bold ${
                      filters.sort === 'relevance' ? 'text-white' : 'text-[#0B1F44]'
                    }`}
                  >
                    {t('Mobile.browse.relevance')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setFilters((f) => ({ ...f, sort: 'date' }))}
                  className={`flex-row items-center rounded-xl px-3.5 py-2 active:opacity-80 ${
                    filters.sort === 'date'
                      ? 'bg-[#0B1F44]'
                      : 'border border-slate-200 bg-white'
                  }`}
                >
                  <Calendar
                    color={filters.sort === 'date' ? '#F5C400' : '#0B1F44'}
                    size={13}
                  />
                  <Text
                    className={`ml-1.5 text-[13px] font-bold ${
                      filters.sort === 'date' ? 'text-white' : 'text-[#0B1F44]'
                    }`}
                  >
                    {t('Mobile.browse.date')}
                  </Text>
                </Pressable>
              </View>

              <View className="h-4" />
            </View>
          }
          ListFooterComponent={
            loading && !refreshing ? (
              <View className="py-6">
                <ActivityIndicator color="#162C66" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View className="mt-8 items-center px-6">
                <Text className="text-sm text-slate-500">
                  {t('Mobile.common.noResults')}
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(v) => setFilters(v)}
        mode={mode}
        initial={filters}
      />
    </View>
  );
}
