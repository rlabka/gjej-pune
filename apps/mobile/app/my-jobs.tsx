import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Briefcase,
  Plus,
  Search as SearchIcon,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { JobItem } from '@/components/JobCard';
import { MyJobRow } from '@/components/MyJobRow';

type Tab = 'all' | 'active' | 'paused';

export default function MyJobsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const dialog = useDialog();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [actionFor, setActionFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = (await getToken()) ?? undefined;
      const res = await api.get<{ ok: boolean; jobs: JobItem[] }>(
        '/api/jobs/mine',
        token
      );
      if (res?.ok) setJobs(res.jobs ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const a = jobs.filter((j) => (j.status ?? 'Active') === 'Active').length;
    const p = jobs.filter((j) => j.status === 'Paused').length;
    return { all: jobs.length, active: a, paused: p };
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const status = (j.status ?? 'Active').toLowerCase();
      if (tab === 'active' && status !== 'active') return false;
      if (tab === 'paused' && status !== 'paused') return false;
      if (q) {
        const hay = `${j.category} ${j.locationCity ?? ''} ${j.locationState ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, tab, query]);

  async function toggleStatus(job: JobItem) {
    const newStatus = (job.status ?? 'Active') === 'Active' ? 'Paused' : 'Active';
    try {
      const token = (await getToken()) ?? undefined;
      await api.put<{ ok: boolean }>(`/api/jobs/${job.id}`, { status: newStatus }, token);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j))
      );
    } catch {
      /* ignore */
    }
    setActionFor(null);
  }

  async function deleteJob(job: JobItem) {
    setActionFor(null);
    const ok = await dialog.confirm({
      title: job.category,
      message: t('Mobile.myJobs.delete') + '?',
      confirmLabel: t('Mobile.myJobs.delete'),
      cancelLabel: t('Mobile.common.cancel') || 'Cancel',
      destructive: true,
    });
    if (!ok) return;
    try {
      const token = (await getToken()) ?? undefined;
      await api.delete<{ ok: boolean }>(`/api/jobs/${job.id}`, token);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch {
      /* ignore */
    }
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Back + Create */}
        <View className="flex-row items-center justify-between px-4 pb-1 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
          >
            <ArrowLeft color="#0B1F44" size={22} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/job/new' as any)}
            className="h-9 w-9 items-center justify-center rounded-xl bg-[#0B1F44] active:opacity-80"
          >
            <Plus color="#FFFFFF" size={18} />
          </Pressable>
        </View>

        <FlatList
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-6">
              <MyJobRow
                item={item}
                onPress={() => router.push(`/job/${item.id}` as any)}
                onEdit={() => router.push(`/job/edit/${item.id}` as any)}
                onMore={() => setActionFor(item.id)}
                menuOpen={actionFor === item.id}
                onToggleStatus={() => toggleStatus(item)}
                onDelete={() => deleteJob(item)}
                onCloseMenu={() => setActionFor(null)}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#162C66"
            />
          }
          ListHeaderComponent={
            <View>
              {/* Header */}
              <View className="mt-2 flex-row items-start px-6">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]/5">
                  <Briefcase color="#162C66" size={20} />
                </View>
                <View className="flex-1 pt-0.5">
                  <Text className="text-2xl font-extrabold text-[#0B1F44]">
                    {t('Mobile.myJobs.title')}
                  </Text>
                  <Text className="mt-1 text-[13px] text-slate-500">
                    {t('Mobile.myJobs.subtitle')}
                  </Text>
                </View>
              </View>

              {/* Search */}
              <View className="mt-4 px-4">
                <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
                  <SearchIcon color="#94A3B8" size={16} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('Mobile.myJobs.searchPlaceholder')}
                    placeholderTextColor="#94A3B8"
                    className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
                    returnKeyType="search"
                  />
                </View>
              </View>

              {/* Tabs */}
              <View className="mt-3 flex-row px-4" style={{ gap: 8 }}>
                <TabPill
                  label={`${t('Mobile.myJobs.tabAll')} (${counts.all})`}
                  active={tab === 'all'}
                  onPress={() => setTab('all')}
                />
                <TabPill
                  label={`${t('Mobile.myJobs.tabActive')} (${counts.active})`}
                  active={tab === 'active'}
                  onPress={() => setTab('active')}
                />
                <TabPill
                  label={`${t('Mobile.myJobs.tabPaused')} (${counts.paused})`}
                  active={tab === 'paused'}
                  onPress={() => setTab('paused')}
                />
              </View>

              <View className="h-3" />
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <View className="mt-12 items-center px-6">
                <Text className="mb-4 text-sm text-slate-500">
                  {t('Mobile.myJobs.empty')}
                </Text>
                <Pressable
                  onPress={() => router.push('/job/new' as any)}
                  className="flex-row items-center rounded-xl bg-[#0B1F44] px-4 py-2.5 active:opacity-80"
                >
                  <Plus color="#FFFFFF" size={16} />
                  <Text className="ml-1.5 text-[13px] font-extrabold text-white">
                    {t('Mobile.myJobs.emptyCta')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="mt-10">
                <ActivityIndicator color="#162C66" />
              </View>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl px-4 py-2.5 active:opacity-80 ${
        active ? 'bg-[#0B1F44]' : 'border border-slate-200 bg-white'
      }`}
    >
      <Text
        className={`text-[13px] font-extrabold ${
          active ? 'text-white' : 'text-[#0B1F44]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

