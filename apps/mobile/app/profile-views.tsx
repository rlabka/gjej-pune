import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Ban,
  Briefcase,
  Calendar,
  Eye,
  Flag,
  Lock,
  MessageCircle,
  MoreVertical,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useDialog } from '@/contexts/DialogContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';
import { ReportSheet } from '@/components/ReportSheet';

type Viewer = {
  id: string;
  viewerId: string;
  viewerName: string;
  viewerImage: string | null;
  viewerRole: string;
  viewerAdId: string | null;
  viewerJobId: string | null;
  targetType: string;
  targetId: string;
  createdAt: string;
};

type ViewsResponse = {
  ok: boolean;
  count: number;
  viewers: Viewer[];
  locked: boolean;
};

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const COPY: Record<Locale, {
  title: string;
  subtitle: string;
  totalLabel: string;
  noViewsTitle: string;
  noViewsDesc: string;
  lockedTitle: string;
  lockedDesc: string;
  visitorsBadge: string;
  upgrade: string;
  contact: string;
  viewedJob: string;
  viewedAd: string;
}> = {
  de: {
    title: 'Profilbesuche',
    subtitle: 'Wer hat dein Profil oder deine Inserate angesehen?',
    totalLabel: 'Besucher',
    noViewsTitle: 'Noch keine Besuche',
    noViewsDesc: 'Sobald jemand dein Profil oder Inserat ansieht, erscheint es hier.',
    lockedTitle: 'Premium-Funktion',
    lockedDesc: 'Diese Funktion ist Premium-Mitgliedern vorbehalten.',
    visitorsBadge: 'Besucher insgesamt',
    upgrade: 'Mehr erfahren',
    contact: 'Kontaktieren',
    viewedJob: 'hat dein Stellenangebot angesehen',
    viewedAd: 'hat dein Profil angesehen',
  },
  en: {
    title: 'Profile Views',
    subtitle: 'Who viewed your profile or listings?',
    totalLabel: 'Visitors',
    noViewsTitle: 'No views yet',
    noViewsDesc: 'As soon as someone views your profile or listing, it will appear here.',
    lockedTitle: 'Premium Feature',
    lockedDesc: 'This feature is available to Premium members.',
    visitorsBadge: 'visitors in total',
    upgrade: 'Learn more',
    contact: 'Contact',
    viewedJob: 'viewed your job listing',
    viewedAd: 'viewed your profile',
  },
  fr: {
    title: 'Visites de profil',
    subtitle: 'Qui a consulté votre profil ou vos annonces ?',
    totalLabel: 'Visiteurs',
    noViewsTitle: 'Aucune visite',
    noViewsDesc: "Dès qu'une personne consulte votre profil, elle apparaît ici.",
    lockedTitle: 'Fonctionnalité Premium',
    lockedDesc: 'Cette fonctionnalité est réservée aux membres Premium.',
    visitorsBadge: 'visiteurs au total',
    upgrade: 'En savoir plus',
    contact: 'Contacter',
    viewedJob: "a consulté votre offre d'emploi",
    viewedAd: 'a consulté votre profil',
  },
  it: {
    title: 'Visite al profilo',
    subtitle: 'Chi ha visualizzato il tuo profilo o i tuoi annunci?',
    totalLabel: 'Visitatori',
    noViewsTitle: 'Nessuna visita',
    noViewsDesc: 'Non appena qualcuno visualizza il tuo profilo, apparirà qui.',
    lockedTitle: 'Funzione Premium',
    lockedDesc: 'Questa funzione è riservata ai membri Premium.',
    visitorsBadge: 'visitatori in totale',
    upgrade: 'Scopri di più',
    contact: 'Contatta',
    viewedJob: 'ha visualizzato il tuo annuncio di lavoro',
    viewedAd: 'ha visualizzato il tuo profilo',
  },
  sq: {
    title: 'Vizitat e profilit',
    subtitle: 'Kush ka parë profilin ose njoftimet e tua?',
    totalLabel: 'Vizitorë',
    noViewsTitle: 'Asnjë vizitë',
    noViewsDesc: 'Sapo dikush të shohë profilin tënd, do të shfaqet këtu.',
    lockedTitle: 'Funksion Premium',
    lockedDesc: 'Ky funksion është për anëtarët Premium.',
    visitorsBadge: 'vizitorë gjithsej',
    upgrade: 'Mëso më shumë',
    contact: 'Kontakto',
    viewedJob: 'ka parë njoftimin tënd të punës',
    viewedAd: 'ka parë profilin tënd',
  },
};

export default function ProfileViewsScreen() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const dialog = useDialog();
  useAuth(); // ensure session context

  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(
    locale as Locale
  )
    ? (locale as Locale)
    : 'sq';
  const c = COPY[l];

  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [count, setCount] = useState(0);
  const [locked, setLocked] = useState(true);
  const [menuViewerId, setMenuViewerId] = useState<string | null>(null);
  const [reportViewerId, setReportViewerId] = useState<string | null>(null);

  async function handleBlock(viewerId: string) {
    setMenuViewerId(null);
    const ok = await dialog.confirm({
      title: t('Mobile.moderation.blockConfirmTitle'),
      message: t('Mobile.moderation.blockConfirmMessage'),
      confirmLabel: t('Mobile.moderation.block'),
      cancelLabel: t('Mobile.moderation.cancel'),
      destructive: true,
    });
    if (!ok) return;
    const token = (await getToken()) ?? undefined;
    try {
      const res = await api.post<{ ok: boolean }>(
        `/api/users/${viewerId}/block`,
        {},
        token
      );
      if (res?.ok) {
        dialog.showSuccess(t('Mobile.moderation.blockSuccess'));
        // refresh viewers list — blocked viewer should disappear server-side
        loadViews();
      } else {
        dialog.showError();
      }
    } catch {
      dialog.showError();
    }
  }

  const loadViews = useCallback(async () => {
    const token = (await getToken()) ?? undefined;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<ViewsResponse>('/api/profile-views', token);
      if (res?.ok) {
        setCount(res.count);
        setViewers(res.viewers ?? []);
        setLocked(res.locked);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  async function onContact(viewerId: string) {
    const token = (await getToken()) ?? undefined;
    if (!token) return;
    try {
      const res = await api.post<{ ok: boolean; conversation?: { id: string } }>(
        '/api/messages/conversations',
        { targetUserId: viewerId },
        token
      );
      if (res?.ok && res.conversation?.id) {
        router.push(`/chat/${res.conversation.id}` as any);
      }
    } catch {
      /* ignore */
    }
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Hero header */}
      <View className="bg-[#0B1F44] pb-12">
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center px-4 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
            >
              <ArrowLeft color="#FFFFFF" size={20} />
            </Pressable>
          </View>

          <View className="px-6 pt-4">
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20">
                <Eye color="#93C5FD" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-[24px] font-extrabold tracking-tight text-white">
                  {c.title}
                </Text>
                <Text className="mt-1 text-[13px] font-medium text-white/55">
                  {c.subtitle}
                </Text>
              </View>
            </View>

            {/* Stat tile — prominent count of total visitors */}
            {!loading ? (
              <View className="mt-5 flex-row items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#F5C400]">
                  <Eye color="#0B1F44" size={20} strokeWidth={2.4} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[28px] font-extrabold leading-tight text-white">
                    {count}
                  </Text>
                  <Text className="text-[12px] font-semibold uppercase tracking-wider text-white/50">
                    {c.totalLabel}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="mx-4 rounded-2xl border border-slate-200 bg-white p-12 items-center">
            <ActivityIndicator color="#162C66" />
          </View>
        ) : locked ? (
          <LockedView c={c} count={count} onUpgrade={() => router.push('/premium' as any)} />
        ) : viewers.length === 0 ? (
          <EmptyState c={c} />
        ) : (
          <View className="mx-4">
            {/* Result count above the list */}
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="text-[13px] font-bold uppercase tracking-wider text-slate-500">
                {c.totalLabel}
              </Text>
              <Text className="text-[16px] font-extrabold text-[#0B1F44]">
                {viewers.length}
              </Text>
            </View>

            {viewers.map((v) => {
              // Resolve the public detail page for this viewer:
              // job-seeker → their first active /ad/<id>;
              // employer   → their most-recent active /job/<id>;
              // anything else (no public listing) → no navigation.
              const profileHref =
                v.viewerAdId
                  ? (`/ad/${v.viewerAdId}` as const)
                  : v.viewerJobId
                  ? (`/job/${v.viewerJobId}` as const)
                  : null;
              return (
                <ViewerRow
                  key={v.id}
                  viewer={v}
                  copy={c}
                  dateLabel={formatDate(v.createdAt)}
                  onContact={() => onContact(v.viewerId)}
                  onMenu={() => setMenuViewerId(v.viewerId)}
                  onOpenProfile={
                    profileHref ? () => router.push(profileHref as any) : null
                  }
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Per-viewer overflow menu — Report / Block (App Store G1.2) */}
      <Modal
        visible={!!menuViewerId}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuViewerId(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setMenuViewerId(null)}
        >
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: 24,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#E2E8F0',
                marginBottom: 8,
              }}
            />
            <Pressable
              onPress={() => {
                const id = menuViewerId;
                setMenuViewerId(null);
                if (id) setReportViewerId(id);
              }}
              className="flex-row items-center px-5 py-4 active:bg-slate-50"
            >
              <Flag color="#0B1F44" size={18} />
              <Text className="ml-3 text-[15px] font-semibold text-[#0B1F44]">
                {t('Mobile.moderation.reportUser')}
              </Text>
            </Pressable>
            <View className="h-px bg-slate-100" />
            <Pressable
              onPress={() => menuViewerId && handleBlock(menuViewerId)}
              className="flex-row items-center px-5 py-4 active:bg-red-50"
            >
              <Ban color="#DC2626" size={18} />
              <Text className="ml-3 text-[15px] font-semibold text-red-600">
                {t('Mobile.moderation.blockUser')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {reportViewerId ? (
        <ReportSheet
          visible={!!reportViewerId}
          targetType="user"
          targetId={reportViewerId}
          title={t('Mobile.moderation.reportUser')}
          onClose={() => setReportViewerId(null)}
        />
      ) : null}
    </View>
  );
}

/* ─── Viewer row ─────────────────────────────────────────── */

function ViewerRow({
  viewer,
  copy,
  dateLabel,
  onContact,
  onMenu,
  onOpenProfile,
}: {
  viewer: Viewer;
  copy: (typeof COPY)[Locale];
  dateLabel: string;
  onContact: () => void;
  onMenu: () => void;
  onOpenProfile: (() => void) | null;
}) {
  const avatarUrl = resolveMediaUrl(config.apiUrl, viewer.viewerImage);
  const isJobTarget = viewer.targetType === 'job';

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white"
      style={{
        shadowColor: '#0B1F44',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Top: avatar + name + date — tappable to open the viewer's profile */}
      <Pressable
        onPress={onOpenProfile ?? undefined}
        disabled={!onOpenProfile}
        className="flex-row items-start p-4 active:bg-slate-50"
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-[#162C66]">
            <UserIcon color="#FFFFFF" size={20} />
          </View>
        )}

        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between">
            <Text
              className="flex-1 text-[15px] font-extrabold tracking-tight text-[#0B1F44]"
              numberOfLines={1}
            >
              {viewer.viewerName}
            </Text>
            <View className="ml-2 flex-row items-center" style={{ gap: 4 }}>
              <Calendar color="#94A3B8" size={11} />
              <Text className="text-[11px] font-medium text-slate-400">
                {dateLabel}
              </Text>
              <Pressable
                onPress={onMenu}
                className="ml-1 h-7 w-7 items-center justify-center rounded-md active:bg-slate-100"
                hitSlop={6}
              >
                <MoreVertical color="#94A3B8" size={14} />
              </Pressable>
            </View>
          </View>

          {/* Action descriptor pill */}
          <View
            className="mt-2 self-start flex-row items-center rounded-lg px-2 py-1"
            style={{ backgroundColor: isJobTarget ? '#EFF6FF' : '#FAF5FF' }}
          >
            {isJobTarget ? (
              <Briefcase color="#2563EB" size={11} />
            ) : (
              <UserIcon color="#9333EA" size={11} />
            )}
            <Text
              className="ml-1.5 text-[11px] font-semibold"
              style={{ color: isJobTarget ? '#1D4ED8' : '#7E22CE' }}
              numberOfLines={1}
            >
              {isJobTarget ? copy.viewedJob : copy.viewedAd}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Bottom: contact CTA */}
      <View className="border-t border-slate-100 px-4 py-3">
        <Pressable
          onPress={onContact}
          className="flex-row items-center justify-center rounded-xl bg-[#162C66] py-3 active:opacity-90"
          style={{
            shadowColor: '#162C66',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <MessageCircle color="#FFFFFF" size={14} />
          <Text className="ml-2 text-[13px] font-extrabold text-white">
            {copy.contact}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Locked (non-premium) view ───────────────────────────── */

function LockedView({
  c,
  count,
  onUpgrade,
}: {
  c: (typeof COPY)[Locale];
  count: number;
  onUpgrade: () => void;
}) {
  return (
    <View>
      {/* Stat bar — count of visitors */}
      {count > 0 ? (
        <View className="mx-4 mb-3 flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <Eye color="#0B1F44" size={14} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[13px] font-medium text-slate-500">
              {c.visitorsBadge}
            </Text>
          </View>
          <Text className="text-[18px] font-extrabold text-[#0B1F44]">
            {count}
          </Text>
        </View>
      ) : null}

      {/* Premium upgrade card — calm, classifieds-style */}
      <View className="mx-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <View className="px-5 py-6">
          <View className="mb-4 flex-row items-center" style={{ gap: 12 }}>
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Lock color="#D97706" size={18} />
            </View>
            <Text className="flex-1 text-[16px] font-bold text-[#0B1F44]">
              {c.lockedTitle}
            </Text>
          </View>
          <Text className="text-[14px] leading-[20px] text-slate-600">
            {c.lockedDesc}
          </Text>
        </View>

        {/* Three masked viewer rows — no opacity tricks, just clean placeholders */}
        <View className="border-t border-slate-100">
          {[0, 1, 2].slice(0, Math.max(1, Math.min(count, 3))).map((i) => (
            <View
              key={i}
              className="flex-row items-center border-b border-slate-100 px-5 py-3 last:border-b-0"
            >
              <View className="h-9 w-9 rounded-full bg-slate-200" />
              <View className="ml-3 flex-1">
                <View className="mb-1.5 h-3 w-1/2 rounded bg-slate-200" />
                <View className="h-2.5 w-1/3 rounded bg-slate-100" />
              </View>
              <Lock color="#94A3B8" size={14} />
            </View>
          ))}
        </View>

        {/* CTA */}
        <View className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <Pressable
            onPress={onUpgrade}
            className="h-[44px] flex-row items-center justify-center rounded-lg bg-[#162C66] active:opacity-90"
          >
            <Text className="text-[14px] font-bold text-white">
              {c.upgrade}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ─── Empty state ────────────────────────────────────────── */

function EmptyState({ c }: { c: (typeof COPY)[Locale] }) {
  return (
    <View
      className="mx-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
      style={{
        shadowColor: '#0B1F44',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View className="items-center px-6 py-10">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Eye color="#CBD5E1" size={28} />
        </View>
        <Text className="text-[16px] font-extrabold text-[#0B1F44]">
          {c.noViewsTitle}
        </Text>
        <Text className="mt-2 max-w-[280px] text-center text-[12px] font-medium leading-relaxed text-slate-500">
          {c.noViewsDesc}
        </Text>
      </View>
    </View>
  );
}
