import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share as RNShare,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Eye,
  Globe,
  Heart,
  HeartOff,
  MapPin,
  MessageSquare,
  Search as SearchIcon,
  Share2,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';
import { JobCard, type JobItem } from '@/components/JobCard';

type BackendAd = {
  id: string;
  userId: string;
  category: string;
  firstName: string;
  surname?: string | null;
  age?: number | null;
  photoUrl?: string | null;
  experience?: string | null;
  livingPlace?: string | null;
  skills?: string[] | string | null;
  spokenLanguages?: string[] | string | null;
  status?: string | null;
  views?: number | null;
  createdAt?: string | null;
  user?: { displayName?: string | null };
};

type Mode = 'ads' | 'jobs';

const LANG_FLAGS: Record<string, string> = {
  sq: '🇦🇱',
  de: '🇩🇪',
  en: '🇬🇧',
  fr: '🇫🇷',
  it: '🇮🇹',
  el: '🇬🇷',
  tr: '🇹🇷',
  sr: '🇷🇸',
  mk: '🇲🇰',
  es: '🇪🇸',
  pt: '🇵🇹',
  ro: '🇷🇴',
  pl: '🇵🇱',
  nl: '🇳🇱',
  ru: '🇷🇺',
  ar: '🇸🇦',
};

const LANG_NAMES_DE: Record<string, string> = {
  sq: 'Albanisch',
  de: 'Deutsch',
  en: 'Englisch',
  fr: 'Französisch',
  it: 'Italienisch',
  el: 'Griechisch',
  tr: 'Türkisch',
  sr: 'Serbisch',
  mk: 'Mazedonisch',
  es: 'Spanisch',
  pt: 'Portugiesisch',
  ro: 'Rumänisch',
  pl: 'Polnisch',
  nl: 'Niederländisch',
  ru: 'Russisch',
  ar: 'Arabisch',
};

function parseArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  try {
    const parsed = JSON.parse(value as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuth();
  const isEmployer = session?.role === 'employer';

  // Role-locked mode: employers see candidates, job-seekers see jobs (matches web)
  const mode: Mode = isEmployer ? 'ads' : 'jobs';
  const [ads, setAds] = useState<BackendAd[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = (await getToken()) ?? undefined;
      if (mode === 'ads') {
        const res = await api.get<{ ok: boolean; ads: BackendAd[] }>(
          '/api/favorites/saved-ads',
          token
        );
        if (res?.ok) setAds(res.ads ?? []);
      } else {
        const res = await api.get<{ ok: boolean; jobs: JobItem[] }>(
          '/api/favorites/saved-jobs',
          token
        );
        if (res?.ok) setJobs(res.jobs ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function removeFavorite(targetType: 'ad' | 'job', targetId: string) {
    const token = (await getToken()) ?? undefined;
    if (!token) return;
    try {
      await api.post(
        '/api/favorites/toggle',
        { targetType, targetId },
        token
      );
      if (targetType === 'ad') {
        setAds((prev) => prev.filter((a) => a.id !== targetId));
      } else {
        setJobs((prev) => prev.filter((j) => j.id !== targetId));
      }
      setToast(t('Mobile.favorites.removedToast'));
    } catch {
      /* ignore */
    }
  }

  async function shareTarget(targetType: 'ad' | 'job', targetId: string, title: string) {
    const base = config.apiUrl.replace(/\/api$/, '');
    const url = `${base}/${targetType}/${targetId}`;
    try {
      await RNShare.share({
        message: `${title}\n${url}`,
        url,
      });
    } catch {
      /* ignore */
    }
    setShareFor(null);
  }

  async function contactCandidate(ad: BackendAd) {
    const token = (await getToken()) ?? undefined;
    if (!token) return;
    try {
      const res = await api.post<{
        ok: boolean;
        conversation: { id: string };
      }>(
        '/api/messages/conversations',
        { targetUserId: ad.userId },
        token
      );
      if (res?.ok && res.conversation?.id) {
        router.push(`/chat/${res.conversation.id}` as any);
      }
    } catch {
      Alert.alert(t('Mobile.common.error'));
    }
  }

  const count = mode === 'ads' ? ads.length : jobs.length;

  const title = isEmployer
    ? t('Mobile.favorites.titleEmployer')
    : t('Mobile.favorites.titleJobSeeker');
  const subtitle = isEmployer
    ? t('Mobile.favorites.subtitleEmployer')
    : t('Mobile.favorites.subtitleJobSeeker');

  const countLabel = useMemo(() => {
    if (mode === 'ads') {
      return count === 1
        ? t('Mobile.favorites.foundCandidatesOne')
        : t('Mobile.favorites.foundCandidatesMany', { count });
    }
    return count === 1
      ? t('Mobile.favorites.foundJobsOne')
      : t('Mobile.favorites.foundJobsMany', { count });
  }, [mode, count, t]);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header row */}
        <View className="flex-row items-center px-4 pb-1 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
          >
            <ArrowLeft color="#0B1F44" size={22} />
          </Pressable>
        </View>

        {/* Toast */}
        {toast ? (
          <View className="mx-5 mb-2 rounded-xl bg-[#0B1F44] px-4 py-3">
            <Text className="text-[13px] font-semibold text-white">
              {toast}
            </Text>
          </View>
        ) : null}

        <FlatList
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          data={mode === 'ads' ? ads : jobs}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => {
            if (mode === 'ads') {
              const ad = item as BackendAd;
              return (
                <View className="px-5">
                  <CandidateCard
                    ad={ad}
                    shareOpen={shareFor === ad.id}
                    onToggleShare={() =>
                      setShareFor((prev) => (prev === ad.id ? null : ad.id))
                    }
                    onShare={() =>
                      shareTarget(
                        'ad',
                        ad.id,
                        `${ad.firstName}${ad.age ? `, ${ad.age}` : ''} — ${ad.category}`
                      )
                    }
                    onRemove={() => removeFavorite('ad', ad.id)}
                    onOpen={() => router.push(`/ad/${ad.id}` as any)}
                    onContact={() => contactCandidate(ad)}
                    t={t}
                  />
                </View>
              );
            }
            const job = item as JobItem;
            return (
              <View className="px-5">
                <JobCard item={job} />
              </View>
            );
          }}
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
              {/* Title block */}
              <View className="mb-5 flex-row items-start px-5">
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100">
                  <Heart color="#F43F5E" size={20} fill="#F43F5E" />
                </View>
                <View className="flex-1 pt-0.5">
                  <Text className="text-2xl font-extrabold text-[#0B1F44]">
                    {title}
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-slate-500">
                    {subtitle}
                  </Text>
                </View>
              </View>

              {/* Count label */}
              {!loading && count > 0 ? (
                <View className="mb-3 px-5">
                  <Text className="text-[13px] font-semibold text-slate-400">
                    {countLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <SkeletonList />
            ) : (
              <EmptyState mode={mode} onBrowse={() => router.push('/(tabs)/search')} t={t} />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

function CandidateCard({
  ad,
  shareOpen,
  onToggleShare,
  onShare,
  onRemove,
  onOpen,
  onContact,
  t,
}: {
  ad: BackendAd;
  shareOpen: boolean;
  onToggleShare: () => void;
  onShare: () => void;
  onRemove: () => void;
  onOpen: () => void;
  onContact: () => void;
  t: (k: string, o?: any) => string;
}) {
  const photo = resolveMediaUrl(config.apiUrl, ad.photoUrl);
  const skills = parseArray(ad.skills).slice(0, 4);
  const languages = parseArray(ad.spokenLanguages);
  const name = `${ad.firstName}${ad.age ? `, ${ad.age}` : ''}`;

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="p-5">
        {/* Top: photo + name + actions */}
        <View className="flex-row items-start">
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{ width: 80, height: 80, borderRadius: 16 }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="items-center justify-center rounded-2xl bg-[#162C66]/[0.06]"
              style={{ width: 80, height: 80 }}
            >
              <UserIcon color="#162C66" size={30} />
            </View>
          )}

          <View className="ml-3 flex-1">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text
                  className="text-lg font-extrabold leading-6 text-[#0B1F44]"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <Briefcase color="rgba(22,44,102,0.5)" size={13} />
                  <Text
                    className="ml-1 text-[14px] font-bold text-[#162C66]/70"
                    numberOfLines={1}
                  >
                    {ad.category}
                  </Text>
                </View>
              </View>

              <View className="flex-row" style={{ gap: 6 }}>
                <Pressable
                  onPress={onRemove}
                  className="h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-100 active:opacity-70"
                >
                  <Heart color="#F43F5E" size={15} fill="#F43F5E" />
                </Pressable>
                <Pressable
                  onPress={onToggleShare}
                  className={`h-9 w-9 items-center justify-center rounded-xl border ${
                    shareOpen
                      ? 'border-blue-200 bg-blue-100'
                      : 'border-blue-100 bg-blue-50'
                  } active:opacity-70`}
                >
                  <Share2 color="#3B82F6" size={15} />
                </Pressable>
              </View>
            </View>

            {/* Experience + languages */}
            <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 6 }}>
              {ad.experience ? (
                <View className="flex-row items-center rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1">
                  <Award color="#10B981" size={13} />
                  <Text className="ml-1 text-[12px] font-extrabold text-emerald-700">
                    {ad.experience} {t('Mobile.favorites.experienceLabel')}
                  </Text>
                </View>
              ) : null}
              {languages.length > 0 ? (
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <View className="h-6 w-6 items-center justify-center rounded-lg bg-sky-50">
                    <Globe color="#0284C7" size={12} />
                  </View>
                  <View className="flex-row items-center" style={{ gap: 3 }}>
                    {languages.slice(0, 3).map((l) => (
                      <View
                        key={l}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5"
                      >
                        <Text className="text-[12px]">
                          {LANG_FLAGS[l] || '🌐'}
                        </Text>
                      </View>
                    ))}
                    {languages.length > 3 ? (
                      <Text className="text-[11px] font-semibold text-slate-400">
                        +{languages.length - 3}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Share menu */}
        {shareOpen ? (
          <View className="mt-3 flex-row rounded-xl border border-slate-200 bg-slate-50 p-1.5">
            <Pressable
              onPress={onShare}
              className="flex-1 flex-row items-center justify-center rounded-lg py-2 active:bg-white"
            >
              <Share2 color="#3B82F6" size={14} />
              <Text className="ml-1.5 text-[12px] font-bold text-slate-600">
                {t('Mobile.favorites.shareAction')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Location + skills chips */}
        {(ad.livingPlace || skills.length > 0) ? (
          <View className="mt-4 flex-row flex-wrap" style={{ gap: 8 }}>
            {ad.livingPlace ? (
              <View className="flex-row items-center rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5">
                <MapPin color="#F59E0B" size={12} />
                <Text className="ml-1 text-[12px] font-extrabold text-amber-700">
                  {ad.livingPlace}
                </Text>
              </View>
            ) : null}
            {skills.map((s) => (
              <View
                key={s}
                className="flex-row items-center rounded-lg border border-violet-100 bg-violet-50 px-3 py-1.5"
              >
                <Sparkles color="#A78BFA" size={11} />
                <Text className="ml-1 text-[12px] font-bold text-violet-700">
                  {s}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Action row */}
        <View className="mt-4 flex-row" style={{ gap: 8 }}>
          <Pressable
            onPress={onOpen}
            className="flex-1 flex-row items-center justify-center rounded-xl border border-[#162C66]/20 bg-[#162C66]/[0.06] px-4 py-2.5 active:opacity-80"
          >
            <Eye color="#162C66" size={14} />
            <Text className="mx-1.5 text-[13px] font-extrabold text-[#162C66]">
              {t('Mobile.favorites.showMore')}
            </Text>
            <ArrowRight color="#162C66" size={13} />
          </Pressable>
          <Pressable
            onPress={onContact}
            className="h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#162C66] active:opacity-80"
          >
            <MessageSquare color="#FFFFFF" size={16} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function EmptyState({
  mode,
  onBrowse,
  t,
}: {
  mode: Mode;
  onBrowse: () => void;
  t: (k: string, o?: any) => string;
}) {
  const title =
    mode === 'ads'
      ? t('Mobile.favorites.emptyCandidates')
      : t('Mobile.favorites.emptyJobs');
  const desc =
    mode === 'ads'
      ? t('Mobile.favorites.emptyCandidatesDesc')
      : t('Mobile.favorites.emptyJobsDesc');
  const cta =
    mode === 'ads'
      ? t('Mobile.favorites.browseCandidates')
      : t('Mobile.favorites.browseJobs');

  return (
    <View className="mx-5 mt-6 items-center rounded-2xl border border-slate-200 bg-white p-10">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <HeartOff color="#CBD5E1" size={30} />
      </View>
      <Text className="mb-1 text-base font-bold text-[#0B1F44]">{title}</Text>
      <Text className="mb-5 max-w-[280px] text-center text-sm text-slate-500">
        {desc}
      </Text>
      <Pressable
        onPress={onBrowse}
        className="flex-row items-center rounded-xl bg-[#162C66] px-5 py-2.5 active:opacity-80"
      >
        <SearchIcon color="#FFFFFF" size={15} />
        <Text className="ml-1.5 text-[13px] font-extrabold text-white">
          {cta}
        </Text>
      </Pressable>
    </View>
  );
}

function SkeletonList() {
  return (
    <View className="px-5">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="mb-3 rounded-2xl border border-slate-100 bg-white p-5"
        >
          <View className="flex-row">
            <View
              className="rounded-2xl bg-slate-100"
              style={{ width: 80, height: 80 }}
            />
            <View className="ml-3 flex-1">
              <View className="h-4 w-3/4 rounded-md bg-slate-100" />
              <View className="mt-2 h-3 w-1/2 rounded-md bg-slate-100" />
              <View className="mt-3 h-6 w-24 rounded-md bg-slate-100" />
            </View>
          </View>
          <View className="mt-4 flex-row" style={{ gap: 6 }}>
            <View className="h-6 w-20 rounded-md bg-slate-100" />
            <View className="h-6 w-16 rounded-md bg-slate-100" />
            <View className="h-6 w-20 rounded-md bg-slate-100" />
          </View>
        </View>
      ))}
    </View>
  );
}
