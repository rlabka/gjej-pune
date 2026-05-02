import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Briefcase,
  Clock,
  Crown,
  Eye,
  Globe,
  Heart,
  MapPin,
  MessageSquare,
  Plus,
  Reply,
  Search as SearchIcon,
  Star,
  Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useI18n } from '@/contexts/I18nContext';
import { getDisplayName, getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { resolveMediaUrl } from '@/lib/useApi';
import { JobCard, type JobItem } from '@/components/JobCard';
import { AdCard, type AdItem } from '@/components/AdCard';
import { MyJobRow } from '@/components/MyJobRow';
import { ProfileCompletion } from '@/components/ProfileCompletion';
import { translateJobTitle } from '@/lib/jobTitle';
import type { Locale } from '@jmp/shared';
import { getNotifTitle, getNotifBody } from '@/lib/notificationLocale';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  meta?: string | null;
  createdAt: string;
};

type MatchCandidate = {
  id: string;
  category: string;
  firstName: string;
  age: number | null;
  photoUrl: string | null;
  experience: string | null;
  livingPlace: string | null;
  skills?: string[];
  spokenLanguages?: string[];
  score: number;
  isBoosted?: boolean;
};

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

export default function HomeScreen() {
  const { session } = useAuth();
  const { t, locale } = useI18n();
  const { unreadCount } = useChat();
  const router = useRouter();

  const name = session ? getDisplayName(session) : '';
  const isEmployer = session?.role === 'employer';
  const isPremium = !!session?.isPremium;

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<JobItem[]>([]);
  const [matchingByJob, setMatchingByJob] = useState<
    Array<{ jobId: string; jobCategory: string; candidates: MatchCandidate[] }>
  >([]);
  const [activities, setActivities] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = (await getToken()) ?? undefined;

      if (isEmployer) {
        const jobsRes = await api.get<{ ok: boolean; jobs: (JobItem & { status?: string })[] }>(
          '/api/jobs/mine',
          token
        );
        const activeJobs = jobsRes?.ok
          ? (jobsRes.jobs ?? []).filter((j) => (j.status ?? 'Active') === 'Active')
          : [];
        setJobs(activeJobs.slice(0, 3));

        // Fetch matching candidates for top 3 active jobs (mirrors web EmployerOverview)
        const topJobs = activeJobs.slice(0, 3);
        if (topJobs.length > 0) {
          try {
            const results = await Promise.all(
              topJobs.map((job) =>
                api
                  .get<{ ok: boolean; candidates: MatchCandidate[] }>(
                    `/api/jobs/${job.id}/matching-candidates`
                  )
                  .then((res) =>
                    res?.ok
                      ? {
                          jobId: job.id,
                          jobCategory: job.category,
                          candidates: res.candidates ?? [],
                        }
                      : null
                  )
                  .catch(() => null)
              )
            );
            const filtered = results.filter(
              (r): r is { jobId: string; jobCategory: string; candidates: MatchCandidate[] } =>
                !!r && r.candidates.length > 0
            );
            setMatchingByJob(filtered);
          } catch {
            setMatchingByJob([]);
          }
        } else {
          setMatchingByJob([]);
        }
      } else {
        const adsRes = await api.get<{ ok: boolean; ads: AdItem[] }>(
          '/api/ads/mine',
          token
        );
        if (adsRes?.ok) setAds((adsRes.ads ?? []).slice(0, 3));

        try {
          const recRes = await api.get<{ ok: boolean; jobs: JobItem[] }>(
            '/api/jobs/recommended',
            token
          );
          if (recRes?.ok) setRecommendedJobs((recRes.jobs ?? []).slice(0, 5));
        } catch {
          /* ignore */
        }
      }

      if (token) {
        try {
          const notifRes = await api.get<{ ok: boolean; notifications: Notification[] }>(
            '/api/notifications?limit=6',
            token
          );
          if (notifRes?.ok) setActivities(notifRes.notifications ?? []);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isEmployer]);

  useEffect(() => {
    load();
  }, [load]);

  const messagesLabel =
    unreadCount === 0
      ? t('Mobile.home.noNewMessages')
      : unreadCount === 1
        ? t('Mobile.home.newMessagesOne')
        : t('Mobile.home.newMessagesMany', { count: unreadCount });

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
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
        >
          {/* Welcome header */}
          <View className="px-6 pb-5 pt-12">
            <Text className="text-3xl font-extrabold leading-9 text-[#0B1F44]">
              {t('Mobile.home.welcomeBack')}{' '}
              <Text className="text-[#F5C400]">{name}</Text>
              <Text className="text-[#0B1F44]">!</Text>
            </Text>
            <Text className="mt-2 text-[15px] leading-relaxed text-slate-500">
              {isEmployer
                ? t('Mobile.home.subtitleEmployer')
                : t('Mobile.home.subtitleJobSeeker')}
            </Text>
          </View>

          {/* Action cards */}
          <View className="px-6">
            <ActionCard
              icon={MessageSquare}
              label={messagesLabel}
              badge={unreadCount > 0 ? unreadCount : null}
              onPress={() => router.push('/(tabs)/chat')}
            />
            <ActionCard
              icon={SearchIcon}
              label={
                isEmployer
                  ? t('Mobile.home.findCandidates')
                  : t('Mobile.home.findJobs')
              }
              onPress={() => router.push('/(tabs)/search')}
            />
            <ActionCard
              icon={Briefcase}
              label={
                isEmployer
                  ? t('Mobile.home.myJobOffers')
                  : t('Mobile.home.myAdProfile')
              }
              onPress={() =>
                router.push((isEmployer ? '/my-jobs' : '/my-ads') as any)
              }
            />
            <ActionCard
              icon={Heart}
              label={
                isEmployer
                  ? t('Mobile.home.favoriteCandidates')
                  : t('Mobile.home.favoriteJobs')
              }
              onPress={() => router.push('/favorites' as any)}
            />
            <ActionCard
              icon={Plus}
              label={
                isEmployer
                  ? t('Mobile.home.publishNewJob')
                  : t('Mobile.home.publishNewAd')
              }
              variant="primary"
              onPress={() =>
                router.push((isEmployer ? '/job/new' : '/ad/new') as any)
              }
            />
          </View>

          {/* Matching candidates per active job (employer) */}
          {isEmployer
            ? matchingByJob.map((group) => (
                <View key={group.jobId}>
                  <SectionHeader
                    icon={Zap}
                    iconColor="#F5C400"
                    iconBg="#FEF3C7"
                    title={`${t('Mobile.home.suggestedCandidates')} · ${group.jobCategory}`}
                    count={group.candidates.length}
                    onViewAll={() => router.push('/(tabs)/search')}
                    viewAllLabel={t('Mobile.home.viewAllShort')}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
                  >
                    {group.candidates.map((c) => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        onPress={() => router.push(`/ad/${c.id}` as any)}
                      />
                    ))}
                  </ScrollView>
                </View>
              ))
            : null}

          {/* Recommended jobs (jobseeker) — always shown so user understands the section exists */}
          {!isEmployer ? (
            <>
              <SectionHeader
                icon={Zap}
                iconColor="#F5C400"
                iconBg="#FEF3C7"
                title={t('Mobile.home.recommendedJobs')}
                count={recommendedJobs.length}
                onViewAll={() => router.push('/(tabs)/search')}
                viewAllLabel={t('Mobile.home.viewAllShort')}
              />
              <View className="px-6">
                {recommendedJobs.length > 0 ? (
                  recommendedJobs.map((j) => <JobCard key={j.id} item={j} />)
                ) : (
                  <View className="items-center rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-8">
                    <Text className="text-center text-[13px] font-medium text-slate-400">
                      {t('Mobile.home.noRecommendations')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Profile completion — encourages job-seekers to fill profile */}
              <View className="mt-4">
                <ProfileCompletion />
              </View>
            </>
          ) : null}

          {/* Active jobs / ads */}
          <View className="mt-4 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-[#0B1F44]">
                {isEmployer
                  ? t('Mobile.home.myActiveJobs')
                  : t('Mobile.home.myActiveProfile')}
              </Text>
              <Pressable
                onPress={() =>
                  router.push((isEmployer ? '/my-jobs' : '/my-ads') as any)
                }
                className="flex-row items-center active:opacity-70"
              >
                <Text className="text-xs font-semibold text-slate-500">
                  {t('Mobile.home.viewAllShort')}
                </Text>
                <ArrowRight color="#94A3B8" size={13} style={{ marginLeft: 4 }} />
              </Pressable>
            </View>

            {loading && jobs.length === 0 && ads.length === 0 ? (
              <ActivityIndicator color="#162C66" />
            ) : isEmployer ? (
              jobs.length === 0 ? (
                <EmptyCard text={t('Mobile.common.empty')} />
              ) : (
                jobs.map((j) => (
                  <MyJobRow
                    key={j.id}
                    item={j}
                    onPress={() => router.push(`/job/${j.id}` as any)}
                    onEdit={() => router.push(`/job/edit/${j.id}` as any)}
                    showMore={false}
                  />
                ))
              )
            ) : ads.length === 0 ? (
              <EmptyCard text={t('Mobile.common.empty')} />
            ) : (
              ads.map((a) => <AdCard key={a.id} item={a} />)
            )}
          </View>

          {/* Recent activity */}
          <View className="mt-6 px-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-[#0B1F44]">
                {t('Mobile.home.recentActivity')}
              </Text>
            </View>
            <ActivityList
              activities={activities}
              loading={loading}
              locale={locale}
              emptyTitle={t('Mobile.home.noActivityYet')}
              emptyDesc={t('Mobile.home.noActivityYetDesc')}
            />
          </View>

          {/* Premium upgrade (employer only, not premium) */}
          {isEmployer && !isPremium ? (
            <View className="mt-6 px-6">
              <PremiumUpgradeCard
                title={t('Mobile.home.upgradePremium')}
                cta={t('Mobile.home.goPremium')}
                benefits={[
                  { icon: Globe, text: t('Mobile.home.premiumBenefitContact') },
                  { icon: Reply, text: t('Mobile.home.premiumBenefitRespond') },
                  { icon: Eye, text: t('Mobile.home.premiumBenefitVisitors') },
                  { icon: Crown, text: t('Mobile.home.premiumBenefitFirst') },
                ]}
                onPress={() => router.push('/premium' as any)}
              />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">
      <Text className="text-center text-sm text-slate-500">{text}</Text>
    </View>
  );
}

function SectionHeader({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  count,
  onViewAll,
  viewAllLabel,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  count?: number;
  onViewAll: () => void;
  viewAllLabel: string;
}) {
  return (
    <View
      className="mb-3 mt-6 flex-row items-center justify-between px-6"
      style={{ gap: 12 }}
    >
      <View className="flex-1 flex-row items-center">
        <View
          className="h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg }}
        >
          <Icon color={iconColor} size={15} />
        </View>
        <Text
          className="ml-2 flex-shrink text-[13px] font-bold text-[#0B1F44]"
          numberOfLines={1}
        >
          {title}
        </Text>
        {typeof count === 'number' ? (
          <View className="ml-2 h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#162C66]/[0.08] px-1.5">
            <Text className="text-[11px] font-extrabold text-[#162C66]">
              {count}
            </Text>
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={onViewAll}
        className="shrink-0 flex-row items-center active:opacity-70"
      >
        <Text className="text-[13px] font-semibold text-[#162C66]">
          {viewAllLabel}
        </Text>
        <ArrowRight color="#162C66" size={13} style={{ marginLeft: 4 }} />
      </Pressable>
    </View>
  );
}

function CandidateCard({
  candidate,
  onPress,
}: {
  candidate: MatchCandidate;
  onPress: () => void;
}) {
  const { locale } = useI18n();
  const pct = Math.min(100, Math.round(candidate.score ?? 0));
  const badgeBg =
    pct >= 80
      ? 'rgba(16,185,129,0.9)'
      : pct >= 60
        ? 'rgba(59,130,246,0.9)'
        : pct >= 40
          ? 'rgba(245,158,11,0.9)'
          : 'rgba(71,85,105,0.85)';

  const photoUrl =
    resolveMediaUrl(config.apiUrl, candidate.photoUrl) ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.firstName)}&background=162C66&color=fff&size=200&bold=true`;

  const languages = Array.isArray(candidate.spokenLanguages)
    ? candidate.spokenLanguages
    : [];

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="relative h-[140px] bg-slate-100">
        <Image
          source={{ uri: photoUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        <View
          className="absolute right-2 top-2 rounded-md px-2 py-0.5"
          style={{ backgroundColor: badgeBg }}
        >
          <Text className="text-[11px] font-extrabold text-white">{pct}%</Text>
        </View>
        {candidate.isBoosted ? (
          <View className="absolute left-2 top-2 h-6 w-6 items-center justify-center rounded-lg bg-[#F5C400]">
            <Crown color="#FFFFFF" size={12} />
          </View>
        ) : null}
      </View>
      <View className="p-3">
        <Text className="text-[14px] font-extrabold text-[#0B1F44]" numberOfLines={1}>
          {candidate.firstName}
          {candidate.age ? `, ${candidate.age}` : ''}
        </Text>
        <Text className="mt-0.5 text-[12px] text-slate-500" numberOfLines={1}>
          {translateJobTitle(candidate.category, locale as Locale)}
        </Text>
        <View className="mt-2 flex-row flex-wrap" style={{ gap: 6 }}>
          {candidate.experience ? (
            <View className="flex-row items-center rounded-md bg-emerald-50 px-1.5 py-0.5">
              <Clock color="#10B981" size={10} />
              <Text className="ml-1 text-[11px] font-semibold text-emerald-700">
                {candidate.experience}
              </Text>
            </View>
          ) : null}
          {candidate.livingPlace ? (
            <View className="flex-row items-center rounded-md bg-slate-50 px-1.5 py-0.5">
              <MapPin color="#94A3B8" size={10} />
              <Text
                className="ml-1 text-[11px] font-medium text-slate-500"
                numberOfLines={1}
                style={{ maxWidth: 110 }}
              >
                {candidate.livingPlace.split(',')[0]}
              </Text>
            </View>
          ) : null}
          {languages.length > 0 ? (
            <View className="flex-row items-center rounded-md bg-slate-50 px-1.5 py-0.5">
              {languages.slice(0, 3).map((l) => (
                <Text key={l} className="text-[12px]">
                  {LANG_FLAGS[l] || '🌐'}
                </Text>
              ))}
              {languages.length > 3 ? (
                <Text className="ml-0.5 text-[10px] text-slate-400">
                  +{languages.length - 3}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function ActivityList({
  activities,
  loading,
  locale,
  emptyTitle,
  emptyDesc,
}: {
  activities: Notification[];
  loading: boolean;
  locale: string;
  emptyTitle: string;
  emptyDesc: string;
}) {
  if (loading && activities.length === 0) {
    return (
      <View className="rounded-2xl bg-white p-6">
        <ActivityIndicator color="#162C66" />
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View className="items-center rounded-2xl bg-white p-8">
        <View className="mb-3 h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <Clock color="#CBD5E1" size={22} />
        </View>
        <Text className="mb-1 text-sm font-bold text-[#0B1F44]">{emptyTitle}</Text>
        <Text className="max-w-[260px] text-center text-[13px] text-slate-400">
          {emptyDesc}
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl bg-white">
      {activities.map((activity, idx) => (
        <ActivityRow
          key={activity.id}
          activity={activity}
          isLast={idx === activities.length - 1}
          locale={locale}
        />
      ))}
    </View>
  );
}

function ActivityRow({
  activity,
  isLast,
  locale,
}: {
  activity: Notification;
  isLast: boolean;
  locale: string;
}) {
  const title = getNotifTitle(activity, locale);
  const body = getNotifBody(activity, locale);
  const iconMap: Record<
    string,
    { icon: LucideIcon; color: string; bg: string }
  > = {
    profile_view: { icon: Eye, color: '#3B82F6', bg: '#EFF6FF' },
    new_message: { icon: MessageSquare, color: '#10B981', bg: '#ECFDF5' },
    premium_activated: { icon: Crown, color: '#D97706', bg: '#FFFBEB' },
    boost_active: { icon: Zap, color: '#9333EA', bg: '#F5F3FF' },
    ad_online: { icon: Briefcase, color: '#10B981', bg: '#ECFDF5' },
    premium_cancelled: { icon: Star, color: '#64748B', bg: '#F1F5F9' },
  };
  const { icon: Icon, color, bg } = iconMap[activity.type] ?? {
    icon: Bell,
    color: '#64748B',
    bg: '#F1F5F9',
  };

  const ms = Date.now() - new Date(activity.createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  const timeAgo =
    mins < 1
      ? 'now'
      : mins < 60
        ? `${mins}m`
        : Math.floor(mins / 60) < 24
          ? `${Math.floor(mins / 60)}h`
          : `${Math.floor(mins / 1440)}d`;

  return (
    <View
      className={`flex-row items-start px-4 py-3.5 ${
        activity.read ? '' : 'bg-blue-50/40'
      } ${isLast ? '' : 'border-b border-slate-50'}`}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: bg }}
      >
        <Icon color={color} size={16} />
      </View>
      <View className="ml-3 flex-1">
        <Text
          className="text-[13px] font-bold text-[#0B1F44]"
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          className="mt-0.5 text-[12px] font-medium text-slate-400"
          numberOfLines={2}
        >
          {body}
        </Text>
      </View>
      <Text className="ml-2 text-[11px] font-medium text-slate-400">
        {timeAgo}
      </Text>
    </View>
  );
}

function PremiumUpgradeCard({
  title,
  cta,
  benefits,
  onPress,
}: {
  title: string;
  cta: string;
  benefits: { icon: LucideIcon; text: string }[];
  onPress: () => void;
}) {
  return (
    <View
      className="overflow-hidden rounded-2xl bg-[#162C66] p-5"
      style={{
        shadowColor: '#0B1F44',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View className="mb-4 h-11 w-11 items-center justify-center rounded-xl bg-[#F5C400]">
        <Crown color="#162C66" size={20} />
      </View>
      <Text className="mb-4 text-lg font-extrabold text-white">{title}</Text>
      <View style={{ gap: 10 }} className="mb-5">
        {benefits.map((b, i) => {
          const BIcon = b.icon;
          return (
            <View key={i} className="flex-row items-start">
              <BIcon
                color="#F5C400"
                size={15}
                style={{ marginTop: 2, marginRight: 10 }}
              />
              <Text
                className="flex-1 text-[13px] font-medium text-white/75"
                style={{ lineHeight: 18 }}
              >
                {b.text}
              </Text>
            </View>
          );
        })}
      </View>
      <Pressable
        onPress={onPress}
        className="items-center rounded-xl bg-[#F5C400] py-3 active:opacity-90"
      >
        <Text className="text-[15px] font-extrabold text-[#162C66]">{cta}</Text>
      </Pressable>
    </View>
  );
}

function ActionCard({
  icon: Icon,
  label,
  onPress,
  variant = 'default',
  badge = null,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary';
  badge?: number | null;
}) {
  const isPrimary = variant === 'primary';
  const bg = isPrimary ? '#0B1F44' : '#F5C400';
  const iconBg = isPrimary ? '#F5C400' : '#0B1F44';
  const iconColor = isPrimary ? '#0B1F44' : '#F5C400';
  const textColor = isPrimary ? '#F5C400' : '#0B1F44';
  const arrowColor = isPrimary ? '#F5C400' : '#0B1F44';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl px-4 py-4 active:opacity-80"
      style={{
        backgroundColor: bg,
        shadowColor: '#0B1F44',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isPrimary ? 0.18 : 0.1,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <View className="relative">
        <View
          className="h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          <Icon color={iconColor} size={20} />
        </View>
        {badge && badge > 0 ? (
          <View className="absolute -right-1.5 -top-1.5 h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1">
            <Text className="text-[10px] font-extrabold text-white">
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        className="ml-4 flex-1 text-[15px] font-extrabold"
        style={{ color: textColor }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <ArrowRight color={arrowColor} size={18} style={{ opacity: 0.7 }} />
    </Pressable>
  );
}
