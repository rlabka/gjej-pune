import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Crown,
  Eye,
  Lock,
  MessageCircle,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';

type Viewer = {
  id: string;
  viewerId: string;
  viewerName: string;
  viewerImage: string | null;
  viewerRole: string;
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
    lockedTitle: 'Premium-Feature',
    lockedDesc: 'Schalte Premium frei, um zu sehen, wer dich besucht hat.',
    visitorsBadge: 'Besucher insgesamt',
    upgrade: 'Premium freischalten',
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
    lockedDesc: 'Unlock Premium to see who visited you.',
    visitorsBadge: 'visitors in total',
    upgrade: 'Unlock Premium',
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
    lockedDesc: 'Débloquez Premium pour voir qui vous a visité.',
    visitorsBadge: 'visiteurs au total',
    upgrade: 'Débloquer Premium',
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
    lockedDesc: 'Sblocca Premium per vedere chi ti ha visitato.',
    visitorsBadge: 'visitatori in totale',
    upgrade: 'Sblocca Premium',
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
    lockedDesc: 'Aktivizo Premium për të parë kush të ka vizituar.',
    visitorsBadge: 'vizitorë gjithsej',
    upgrade: 'Aktivizo Premium',
    contact: 'Kontakto',
    viewedJob: 'ka parë njoftimin tënd të punës',
    viewedAd: 'ka parë profilin tënd',
  },
};

export default function ProfileViewsScreen() {
  const router = useRouter();
  const { locale } = useI18n();
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
        { recipientId: viewerId },
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

            {/* Stat-Pill */}
            {!loading && count > 0 ? (
              <View className="mt-5 flex-row self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Sparkles color="#F5C400" size={12} />
                <Text className="ml-1.5 text-[12px] font-extrabold text-white">
                  {count}
                </Text>
                <Text className="ml-1.5 text-[12px] font-medium text-white/60">
                  {c.totalLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1 -mt-7"
        contentContainerStyle={{ paddingBottom: 60 }}
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
            {viewers.map((v) => (
              <ViewerRow
                key={v.id}
                viewer={v}
                copy={c}
                dateLabel={formatDate(v.createdAt)}
                onContact={() => onContact(v.viewerId)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Viewer row ─────────────────────────────────────────── */

function ViewerRow({
  viewer,
  copy,
  dateLabel,
  onContact,
}: {
  viewer: Viewer;
  copy: (typeof COPY)[Locale];
  dateLabel: string;
  onContact: () => void;
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
      {/* Top: avatar + name + date */}
      <View className="flex-row items-start p-4">
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
      </View>

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
    <View
      className="mx-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
      style={{
        shadowColor: '#0B1F44',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
      }}
    >
      <View className="items-center px-6 py-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
          <Lock color="#D97706" size={28} />
        </View>
        <Text className="text-[18px] font-extrabold tracking-tight text-[#0B1F44]">
          {c.lockedTitle}
        </Text>
        <Text className="mt-2 max-w-[280px] text-center text-[13px] font-medium leading-relaxed text-slate-500">
          {c.lockedDesc}
        </Text>

        {count > 0 ? (
          <View className="mt-4 flex-row items-center rounded-full bg-[#162C66]/[0.06] px-4 py-2">
            <Eye color="#162C66" size={13} />
            <Text className="ml-1.5 text-[13px] font-extrabold text-[#162C66]">
              {count}
            </Text>
            <Text className="ml-1.5 text-[12px] font-semibold text-[#162C66]/70">
              {c.visitorsBadge}
            </Text>
          </View>
        ) : null}

        {/* Blurred placeholder rows */}
        <View className="mt-6 w-full" style={{ gap: 8 }}>
          {Array.from({ length: Math.max(1, Math.min(count, 4)) }).map((_, i) => (
            <View
              key={i}
              className="flex-row items-center rounded-xl border border-slate-100 bg-slate-50/70 p-3"
              style={{ opacity: 0.4 - i * 0.08 }}
            >
              <View className="h-10 w-10 rounded-full bg-slate-200" />
              <View className="ml-3 flex-1">
                <View className="mb-1.5 h-3 w-2/3 rounded-md bg-slate-200" />
                <View className="h-2.5 w-1/2 rounded-md bg-slate-100" />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={onUpgrade}
          className="mt-7 flex-row items-center rounded-xl bg-[#F5C400] px-7 py-3.5 active:opacity-90"
          style={{
            shadowColor: '#F5C400',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Crown color="#162C66" size={16} />
          <Text className="ml-2 text-[14px] font-extrabold text-[#162C66]">
            {c.upgrade}
          </Text>
        </Pressable>
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
