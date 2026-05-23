import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  ClockAlert,
  Coins,
  Crown,
  Eye,
  Flag,
  Lock,
  MapPin,
  MessageCircle,
  MoreVertical,
  Pencil,
  Share2,
} from 'lucide-react-native';
import { api } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';
import { translateJobTitle } from '@/lib/jobTitle';
import type { Locale } from '@jmp/shared';
import { useDialog } from '@/contexts/DialogContext';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/auth';
import { ReportSheet } from '@/components/ReportSheet';

type JobDetail = {
  id: string;
  userId: string;
  category: string;
  companyName?: string | null;
  salary?: number | null;
  salaryType?: string | null;
  currency?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  countryCode?: string | null;
  when?: string | null;
  description?: string | null;
  views?: number;
  createdAt?: string | null;
  user?: {
    displayName?: string | null;
    email?: string | null;
    isPremium?: boolean | null;
  } | null;
};

const PERIOD_LABEL: Record<string, string> = {
  Hour: '/Std.',
  Month: '/Monat',
  Year: '/Jahr',
  Provision: '%',
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();
  const dialog = useDialog();
  const { session } = useAuth();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwnJob = !!(session && job && job.userId === session.userId);
  const isJobSeeker = session?.role === 'job-seeker';
  const isPremium = !!session?.isPremium;
  const canContact = !isOwnJob && (isJobSeeker || isPremium);

  useEffect(() => {
    (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const res = await api.get<{ ok: boolean; job: JobDetail }>(
          `/api/jobs/${id}`,
          token
        );
        if (res?.ok) setJob(res.job);
      } catch {
        /* show error state */
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const res = await api.get<{ ok: boolean; jobIds: string[]; adIds: string[] }>(
          '/api/favorites/ids',
          token
        );
        if (res?.ok) setSaved(res.jobIds.includes(id));
      } catch {
        /* ignore */
      }
    })();
  }, [id, session]);

  async function toggleFavorite() {
    if (!session) {
      router.push('/(auth)/login');
      return;
    }
    setSavingFav(true);
    try {
      const token = (await getToken()) ?? undefined;
      await api.post('/api/favorites/toggle', { targetType: 'job', targetId: id }, token);
      setSaved((s) => !s);
    } catch {
      dialog.showError(t('Mobile.common.error'));
    } finally {
      setSavingFav(false);
    }
  }

  async function onContact() {
    if (!job) return;
    if (!session) {
      router.push('/(auth)/login');
      return;
    }
    if (!canContact) {
      router.push('/premium' as any);
      return;
    }
    setStartingChat(true);
    try {
      const token = (await getToken()) ?? undefined;
      const res = await api.post<{ ok: boolean; conversation: { id: string } }>(
        '/api/messages/conversations',
        { targetUserId: job.userId, jobId: job.id, jobTitle: job.category },
        token
      );
      if (res?.ok && res.conversation?.id) {
        router.push(`/chat/${res.conversation.id}` as any);
      } else {
        dialog.showError(t('Mobile.common.error'));
      }
    } catch {
      dialog.showError(t('Mobile.common.error'));
    } finally {
      setStartingChat(false);
    }
  }

  async function onShare() {
    if (!job) return;
    const localizedCategory = translateJobTitle(job.category, locale as Locale);
    await Share.share({
      message: `${localizedCategory}${job.companyName ? ` — ${job.companyName}` : ''}`,
    });
  }

  const salaryLabel = useMemo(() => {
    if (!job?.salary || job.salary <= 0) return null;
    const curr = job.currency ?? 'CHF';
    const type = job.salaryType ?? 'Hour';
    if (type === 'Provision') return `${job.salary}%`;
    const period = PERIOD_LABEL[type] ?? '';
    return `${curr} ${job.salary.toLocaleString()}${period}`;
  }, [job?.salary, job?.salaryType, job?.currency]);

  const location = useMemo(
    () => [job?.locationCity, job?.locationState].filter(Boolean).join(', '),
    [job?.locationCity, job?.locationState]
  );

  const isUrgent = job?.when?.toLowerCase().includes('urgent');
  const postedRelative = useMemo(() => {
    if (!job?.createdAt) return null;
    const d = new Date(job.createdAt);
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [job?.createdAt, locale]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#162C66" />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-slate-500">
            {t('Mobile.common.error')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 rounded-xl bg-[#162C66] px-5 py-2"
          >
            <Text className="text-sm font-bold text-white">
              {t('Mobile.common.back')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Top bar */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between border-b border-slate-200/60 px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-50"
          >
            <ArrowLeft color="#0B1F44" size={20} />
          </Pressable>
          <View className="flex-row" style={{ gap: 4 }}>
            {isOwnJob ? (
              <Pressable
                onPress={() => router.push(`/job/edit/${id}` as any)}
                className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-50"
              >
                <Pencil color="#162C66" size={18} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={onShare}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-50"
            >
              <Share2 color="#162C66" size={18} />
            </Pressable>
            <Pressable
              onPress={toggleFavorite}
              disabled={savingFav}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-50"
            >
              {saved ? (
                <BookmarkCheck color="#F5C400" fill="#F5C400" size={18} />
              ) : (
                <Bookmark color="#162C66" size={18} />
              )}
            </Pressable>
            {!isOwnJob && job ? (
              <Pressable
                onPress={() => setMenuOpen(true)}
                className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-50"
                accessibilityLabel={t('Mobile.moderation.report')}
              >
                <MoreVertical color="#162C66" size={18} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero card ─────────────────────────────── */}
        <View
          className="mx-4 mt-4 overflow-hidden rounded-3xl border border-slate-200/60 bg-white"
          style={{
            shadowColor: '#0B1F44',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.06,
            shadowRadius: 18,
            elevation: 3,
          }}
        >
          {/* Top section with category — company name intentionally hidden
              on the public detail view (only shown once a conversation
              starts, to protect employer identity in the public feed). */}
          <View className="border-b border-slate-100 p-5">
            <View className="flex-row items-start" style={{ gap: 14 }}>
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#162C66]/[0.06]">
                <Briefcase color="#162C66" size={26} />
              </View>
              <View className="flex-1 pt-0.5">
                <Text className="text-[22px] font-extrabold leading-tight tracking-tight text-[#0B1F44]">
                  {translateJobTitle(job.category, locale as Locale)}
                </Text>
                {job.user?.isPremium ? (
                  <View className="mt-2 flex-row" style={{ gap: 6 }}>
                    <View className="flex-row items-center rounded-md bg-[#F5C400]/15 px-1.5 py-0.5">
                      <Crown color="#B45309" size={10} />
                      <Text className="ml-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700">
                        Premium
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Pills row */}
            <View className="mt-4 flex-row flex-wrap" style={{ gap: 6 }}>
              {salaryLabel ? (
                <View className="flex-row items-center rounded-lg bg-emerald-50 px-2.5 py-1.5 border border-emerald-100">
                  <Coins color="#059669" size={12} />
                  <Text className="ml-1.5 text-[12px] font-extrabold text-emerald-700">
                    {salaryLabel}
                  </Text>
                </View>
              ) : null}
              {location ? (
                <View className="flex-row items-center rounded-lg bg-amber-50 px-2.5 py-1.5 border border-amber-100">
                  <MapPin color="#F59E0B" size={12} />
                  <Text className="ml-1.5 text-[12px] font-extrabold text-amber-700">
                    {location}
                  </Text>
                </View>
              ) : null}
              {job.when ? (
                <View
                  className={`flex-row items-center rounded-lg border px-2.5 py-1.5 ${
                    isUrgent
                      ? 'border-red-100 bg-red-50'
                      : 'border-purple-100 bg-purple-50'
                  }`}
                >
                  {isUrgent ? (
                    <ClockAlert color="#EF4444" size={12} />
                  ) : (
                    <CalendarClock color="#9333EA" size={12} />
                  )}
                  <Text
                    className={`ml-1.5 text-[12px] font-extrabold ${
                      isUrgent ? 'text-red-600' : 'text-purple-700'
                    }`}
                  >
                    {job.when}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Meta footer */}
          {postedRelative || typeof job.views === 'number' ? (
            <View className="flex-row items-center justify-between bg-slate-50/60 px-5 py-3">
              {postedRelative ? (
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Calendar color="#94A3B8" size={12} />
                  <Text className="text-[11px] font-semibold text-slate-500">
                    {postedRelative}
                  </Text>
                </View>
              ) : <View />}
              {typeof job.views === 'number' ? (
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Eye color="#94A3B8" size={12} />
                  <Text className="text-[11px] font-semibold text-slate-500">
                    {job.views}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ─── Description card ─────────────────────── */}
        {job.description && job.description.trim().length > 0 ? (
          <View
            className="mx-4 mt-4 overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5"
            style={{
              shadowColor: '#0B1F44',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View className="mb-3 flex-row items-center" style={{ gap: 8 }}>
              <View className="h-1 w-6 rounded-full bg-[#F5C400]" />
              <Text className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {t('Mobile.job.description')}
              </Text>
            </View>
            <Text className="text-[14px] leading-relaxed text-slate-700">
              {job.description}
            </Text>
          </View>
        ) : null}

        {/* ─── Premium gate notice (employer non-premium) ─── */}
        {!isOwnJob && !canContact && session ? (
          <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-[#162C66] p-5">
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F5C400]/15">
                <Lock color="#F5C400" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-extrabold text-white">
                  Premium-Funktion
                </Text>
                <Text className="mt-0.5 text-[12px] text-white/60">
                  Das Kontaktieren von Arbeitgebern ist Premium-Mitgliedern vorbehalten.
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* ─── Sticky bottom CTA ─────────────────────── */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200/60 bg-white px-4 pt-3"
        style={{
          paddingBottom: 24,
          shadowColor: '#0B1F44',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {isOwnJob ? (
          <Pressable
            onPress={() => router.push(`/job/edit/${id}` as any)}
            className="h-[52px] flex-row items-center justify-center rounded-xl bg-[#162C66] active:opacity-90"
            style={{
              shadowColor: '#162C66',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Pencil color="#FFFFFF" size={16} />
            <Text className="ml-2 text-[15px] font-extrabold text-white">
              {t('Mobile.common.edit')}
            </Text>
          </Pressable>
        ) : canContact ? (
          <Pressable
            onPress={onContact}
            disabled={startingChat}
            className="h-[52px] flex-row items-center justify-center rounded-xl bg-[#F5C400] active:opacity-90 disabled:opacity-60"
            style={{
              shadowColor: '#F5C400',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {startingChat ? (
              <ActivityIndicator color="#162C66" />
            ) : (
              <>
                <MessageCircle color="#162C66" size={16} />
                <Text className="ml-2 text-[15px] font-extrabold text-[#162C66]">
                  {t('Mobile.job.contactEmployer')}
                </Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/premium' as any)}
            className="h-[52px] flex-row items-center justify-center rounded-xl bg-[#F5C400] active:opacity-90"
            style={{
              shadowColor: '#F5C400',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Crown color="#162C66" size={16} />
            <Text className="ml-2 text-[15px] font-extrabold text-[#162C66]">
              Mehr erfahren
            </Text>
          </Pressable>
        )}
      </View>

      {/* Header overflow-menu — Report this job (App Store G1.2) */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setMenuOpen(false)}
        >
          <View
            style={{
              position: 'absolute',
              top: 90,
              right: 12,
              backgroundColor: 'white',
              borderRadius: 14,
              minWidth: 220,
              paddingVertical: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
              className="flex-row items-center px-4 py-3 active:bg-slate-50"
            >
              <Flag color="#0B1F44" size={16} />
              <Text className="ml-3 text-[14px] font-semibold text-[#0B1F44]">
                {t('Mobile.moderation.reportJob')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {job ? (
        <ReportSheet
          visible={reportOpen}
          targetType="job"
          targetId={job.id}
          title={t('Mobile.moderation.reportJob')}
          onClose={() => setReportOpen(false)}
        />
      ) : null}
    </View>
  );
}
