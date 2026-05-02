import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  Award,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Crown,
  Eye,
  Globe2,
  Lock,
  MapPin,
  MessageCircle,
  Pencil,
  Share2,
  Sparkles,
  User as UserIcon,
  Zap,
} from 'lucide-react-native';
import { api } from '@/lib/api';
import { useI18n } from '@/contexts/I18nContext';
import { translateJobTitle } from '@/lib/jobTitle';
import { useDialog } from '@/contexts/DialogContext';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/auth';
import { config } from '@/lib/config';
import { resolveMediaUrl } from '@/lib/useApi';

type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const LANG_FLAGS: Record<string, string> = {
  sq: '🇦🇱', de: '🇩🇪', en: '🇬🇧', fr: '🇫🇷', it: '🇮🇹',
  el: '🇬🇷', tr: '🇹🇷', sr: '🇷🇸', mk: '🇲🇰', es: '🇪🇸',
  pt: '🇵🇹', ro: '🇷🇴', pl: '🇵🇱', nl: '🇳🇱', ru: '🇷🇺', ar: '🇸🇦',
};

const LANG_NAMES: Record<Locale, Record<string, string>> = {
  de: { sq: 'Albanisch', de: 'Deutsch', en: 'Englisch', fr: 'Französisch', it: 'Italienisch', el: 'Griechisch', tr: 'Türkisch', sr: 'Serbisch', mk: 'Mazedonisch', es: 'Spanisch', pt: 'Portugiesisch', ro: 'Rumänisch', pl: 'Polnisch', nl: 'Niederländisch', ru: 'Russisch', ar: 'Arabisch' },
  en: { sq: 'Albanian', de: 'German', en: 'English', fr: 'French', it: 'Italian', el: 'Greek', tr: 'Turkish', sr: 'Serbian', mk: 'Macedonian', es: 'Spanish', pt: 'Portuguese', ro: 'Romanian', pl: 'Polish', nl: 'Dutch', ru: 'Russian', ar: 'Arabic' },
  fr: { sq: 'Albanais', de: 'Allemand', en: 'Anglais', fr: 'Français', it: 'Italien', el: 'Grec', tr: 'Turc', sr: 'Serbe', mk: 'Macédonien', es: 'Espagnol', pt: 'Portugais', ro: 'Roumain', pl: 'Polonais', nl: 'Néerlandais', ru: 'Russe', ar: 'Arabe' },
  it: { sq: 'Albanese', de: 'Tedesco', en: 'Inglese', fr: 'Francese', it: 'Italiano', el: 'Greco', tr: 'Turco', sr: 'Serbo', mk: 'Macedone', es: 'Spagnolo', pt: 'Portoghese', ro: 'Rumeno', pl: 'Polacco', nl: 'Olandese', ru: 'Russo', ar: 'Arabo' },
  sq: { sq: 'Shqip', de: 'Gjermanisht', en: 'Anglisht', fr: 'Frëngjisht', it: 'Italisht', el: 'Greqisht', tr: 'Turqisht', sr: 'Serbisht', mk: 'Maqedonisht', es: 'Spanjisht', pt: 'Portugalisht', ro: 'Rumanisht', pl: 'Polonisht', nl: 'Holandisht', ru: 'Rusisht', ar: 'Arabisht' },
};

const COPY: Record<Locale, {
  experience: string;
  experienceLabel: string;
  skills: string;
  languages: string;
  livingPlace: string;
  contact: (name: string) => string;
  contactNotPremium: string;
  edit: string;
  premiumLockTitle: string;
  premiumLockDesc: string;
  premiumCta: string;
  match: string;
  topMatch: string;
  boost: string;
  saved: string;
  save: string;
}> = {
  de: {
    experience: 'Erfahrung',
    experienceLabel: 'Berufserfahrung',
    skills: 'Eigenschaften',
    languages: 'Sprachen',
    livingPlace: 'Wohnort',
    contact: (n) => `${n} kontaktieren`,
    contactNotPremium: 'Premium für Kontakt',
    edit: 'Bearbeiten',
    premiumLockTitle: 'Premium erforderlich',
    premiumLockDesc: 'Schalte Premium frei, um Kandidaten zu kontaktieren.',
    premiumCta: 'Premium freischalten',
    match: 'Match',
    topMatch: 'Top Match',
    boost: 'Premium Profil',
    saved: 'Gemerkt',
    save: 'Merken',
  },
  en: {
    experience: 'Experience',
    experienceLabel: 'Work experience',
    skills: 'Traits',
    languages: 'Languages',
    livingPlace: 'Location',
    contact: (n) => `Contact ${n}`,
    contactNotPremium: 'Premium for contact',
    edit: 'Edit',
    premiumLockTitle: 'Premium required',
    premiumLockDesc: 'Unlock Premium to contact candidates.',
    premiumCta: 'Unlock Premium',
    match: 'Match',
    topMatch: 'Top Match',
    boost: 'Premium Profile',
    saved: 'Saved',
    save: 'Save',
  },
  fr: {
    experience: 'Expérience',
    experienceLabel: 'Expérience',
    skills: 'Qualités',
    languages: 'Langues',
    livingPlace: 'Lieu',
    contact: (n) => `Contacter ${n}`,
    contactNotPremium: 'Premium pour contacter',
    edit: 'Modifier',
    premiumLockTitle: 'Premium requis',
    premiumLockDesc: 'Débloquez Premium pour contacter les candidats.',
    premiumCta: 'Débloquer Premium',
    match: 'Match',
    topMatch: 'Top Match',
    boost: 'Profil Premium',
    saved: 'Enregistré',
    save: 'Enregistrer',
  },
  it: {
    experience: 'Esperienza',
    experienceLabel: 'Esperienza lavorativa',
    skills: 'Qualità',
    languages: 'Lingue',
    livingPlace: 'Luogo',
    contact: (n) => `Contatta ${n}`,
    contactNotPremium: 'Premium per contattare',
    edit: 'Modifica',
    premiumLockTitle: 'Premium richiesto',
    premiumLockDesc: 'Sblocca Premium per contattare i candidati.',
    premiumCta: 'Sblocca Premium',
    match: 'Match',
    topMatch: 'Top Match',
    boost: 'Profilo Premium',
    saved: 'Salvato',
    save: 'Salva',
  },
  sq: {
    experience: 'Përvoja',
    experienceLabel: 'Përvoja e punës',
    skills: 'Cilësitë',
    languages: 'Gjuhët',
    livingPlace: 'Vendndodhja',
    contact: (n) => `Kontakto ${n}`,
    contactNotPremium: 'Premium për kontakt',
    edit: 'Ndrysho',
    premiumLockTitle: 'Premium i nevojshëm',
    premiumLockDesc: 'Aktivizo Premium për të kontaktuar kandidatët.',
    premiumCta: 'Aktivizo Premium',
    match: 'Përputhje',
    topMatch: 'Top Përputhje',
    boost: 'Profil Premium',
    saved: 'I ruajtur',
    save: 'Ruaj',
  },
};

type AdDetail = {
  id: string;
  userId: string;
  category: string;
  firstName?: string | null;
  surname?: string | null;
  age?: number | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  experience?: string | null;
  livingPlace?: string | null;
  skills?: string[] | string | null;
  spokenLanguages?: string[] | string | null;
  isBoosted?: boolean;
  score?: number | null;
  isTopMatch?: boolean;
  views?: number;
  createdAt?: string | null;
  user?: { displayName?: string | null; isPremium?: boolean | null } | null;
};

function parseList(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function matchColorsFor(pct: number | null): { bg: string; text: string } {
  if (pct === null) return { bg: '#F1F5F9', text: '#475569' };
  if (pct >= 80) return { bg: '#ECFDF5', text: '#047857' };
  if (pct >= 60) return { bg: '#EFF6FF', text: '#1D4ED8' };
  if (pct >= 40) return { bg: '#FFFBEB', text: '#B45309' };
  return { bg: '#F1F5F9', text: '#475569' };
}

export default function AdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useI18n();
  const dialog = useDialog();
  const { session } = useAuth();

  const l: Locale = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(
    locale as Locale
  )
    ? (locale as Locale)
    : 'sq';
  const c = COPY[l];

  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const isOwn = !!(session && ad && ad.userId === session.userId);
  const isJobSeeker = session?.role === 'job-seeker';
  const isPremium = !!session?.isPremium;
  // Job-seekers can chat free; employers need premium
  const canContact = !isOwn && (isJobSeeker || isPremium);

  useEffect(() => {
    (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const res = await api.get<{ ok: boolean; ad: AdDetail }>(
          `/api/ads/${id}`,
          token
        );
        if (res?.ok) setAd(res.ad);
      } catch {
        /* ignore */
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
        if (res?.ok) setSaved(res.adIds.includes(id));
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
      await api.post('/api/favorites/toggle', { targetType: 'ad', targetId: id }, token);
      setSaved((s) => !s);
    } catch {
      dialog.showError();
    } finally {
      setSavingFav(false);
    }
  }

  async function onShare() {
    if (!ad) return;
    const name = [ad.firstName, ad.surname].filter(Boolean).join(' ');
    await Share.share({ message: `${name} – ${translateJobTitle(ad.category, l)}` });
  }

  async function onContact() {
    if (!ad) return;
    if (!session) {
      router.push('/(auth)/login');
      return;
    }
    if (isOwn) return;
    if (!canContact) {
      router.push('/premium' as any);
      return;
    }
    setStartingChat(true);
    try {
      const token = (await getToken()) ?? undefined;
      const res = await api.post<{ ok: boolean; conversation: { id: string } }>(
        '/api/messages/conversations',
        { targetUserId: ad.userId },
        token
      );
      if (res?.ok && res.conversation?.id) {
        router.push(`/chat/${res.conversation.id}` as any);
      } else {
        dialog.showError();
      }
    } catch {
      dialog.showError();
    } finally {
      setStartingChat(false);
    }
  }

  const photo = useMemo(
    () => (ad ? resolveMediaUrl(config.apiUrl, ad.photoUrl) : null),
    [ad]
  );
  const skills = useMemo(() => parseList(ad?.skills), [ad?.skills]);
  const languages = useMemo(() => parseList(ad?.spokenLanguages), [ad?.spokenLanguages]);
  const matchPct = ad?.score != null ? Math.min(100, Math.max(0, Math.round(ad.score))) : null;
  const matchColors = matchColorsFor(matchPct);
  const postedRelative = useMemo(() => {
    if (!ad?.createdAt) return null;
    return new Date(ad.createdAt).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, [ad?.createdAt, locale]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#162C66" />
        </View>
      </SafeAreaView>
    );
  }

  if (!ad) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-slate-500">Error loading profile</Text>
          <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-[#162C66] px-5 py-2">
            <Text className="text-sm font-bold text-white">Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const firstName = ad.firstName ?? '';
  const fullName = [ad.firstName, ad.surname].filter(Boolean).join(' ') || 'Candidate';
  const initials =
    [ad.firstName, ad.surname]
      .filter(Boolean)
      .map((s) => s!.charAt(0).toUpperCase())
      .join('') || '?';

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
            {isOwn ? (
              <Pressable
                onPress={() => router.push(`/ad/edit/${id}` as any)}
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
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero card ──────────────────────────────── */}
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
          {/* Top badges (boost / match) */}
          {(ad.isBoosted || matchPct !== null) ? (
            <View
              className="flex-row items-center bg-slate-50/60 px-5 py-2.5 border-b border-slate-100"
              style={{ gap: 6 }}
            >
              {ad.isBoosted ? (
                <View className="flex-row items-center rounded-md bg-[#F5C400]/15 px-2 py-1">
                  <Crown color="#B45309" size={11} />
                  <Text className="ml-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                    {c.boost}
                  </Text>
                </View>
              ) : null}
              {matchPct !== null ? (
                <View
                  className="flex-row items-center rounded-md px-2 py-1"
                  style={{ backgroundColor: matchColors.bg }}
                >
                  <Zap size={11} color={matchColors.text} />
                  <Text
                    className="ml-1 text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: matchColors.text }}
                  >
                    {matchPct}% {c.match}
                  </Text>
                </View>
              ) : null}
              {ad.isTopMatch ? (
                <View className="flex-row items-center rounded-md bg-emerald-50 px-2 py-1">
                  <Sparkles color="#059669" size={11} />
                  <Text className="ml-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                    {c.topMatch}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Avatar + name */}
          <View className="items-center px-6 pt-7 pb-4">
            <View
              className="overflow-hidden rounded-3xl border-4 border-white"
              style={{
                shadowColor: '#0B1F44',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={{ width: 110, height: 110 }} />
              ) : (
                <View
                  className="items-center justify-center bg-[#162C66]"
                  style={{ width: 110, height: 110 }}
                >
                  <Text className="text-[40px] font-extrabold text-white">
                    {initials}
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-4 flex-row items-center" style={{ gap: 6 }}>
              <Text className="text-[24px] font-extrabold tracking-tight text-[#0B1F44]">
                {fullName}
              </Text>
              {ad.age ? (
                <View className="rounded-md bg-slate-100 px-2 py-0.5">
                  <Text className="text-[12px] font-bold text-slate-600">
                    {ad.age}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text className="mt-1 text-center text-[14px] font-semibold text-slate-500">
              {translateJobTitle(ad.category, l)}
            </Text>

            {ad.livingPlace ? (
              <View
                className="mt-3 flex-row items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5"
                style={{ gap: 6 }}
              >
                <MapPin color="#64748B" size={12} />
                <Text className="text-[12px] font-semibold text-slate-600">
                  {ad.livingPlace.split(',')[0]}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Meta footer */}
          {postedRelative || typeof ad.views === 'number' ? (
            <View className="flex-row items-center justify-between bg-slate-50/60 px-5 py-3 border-t border-slate-100">
              {postedRelative ? (
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Calendar color="#94A3B8" size={12} />
                  <Text className="text-[11px] font-semibold text-slate-500">
                    {postedRelative}
                  </Text>
                </View>
              ) : <View />}
              {typeof ad.views === 'number' ? (
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Eye color="#94A3B8" size={12} />
                  <Text className="text-[11px] font-semibold text-slate-500">
                    {ad.views}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ─── Experience badge (emerald) ──────────────── */}
        {ad.experience ? (
          <View
            className="mx-4 mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-5"
          >
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/60">
                <Award color="#059669" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                  {c.experienceLabel}
                </Text>
                <Text className="mt-0.5 text-[18px] font-extrabold text-emerald-700">
                  {ad.experience}
                </Text>
              </View>
              <Clock color="#10B981" size={20} />
            </View>
          </View>
        ) : null}

        {/* ─── Languages ──────────────────────────────── */}
        {languages.length > 0 ? (
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
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Globe2 color="#64748B" size={12} />
                <Text className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  {c.languages}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {languages.map((lang) => (
                <View
                  key={lang}
                  className="flex-row items-center rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1.5"
                  style={{ gap: 5 }}
                >
                  <Text className="text-[13px]">{LANG_FLAGS[lang] ?? '🌐'}</Text>
                  <Text className="text-[12px] font-bold text-sky-800">
                    {LANG_NAMES[l]?.[lang] ?? lang}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ─── Skills ─────────────────────────────────── */}
        {skills.length > 0 ? (
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
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Sparkles color="#64748B" size={12} />
                <Text className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  {c.skills}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 6 }}>
              {skills.map((skill) => (
                <View
                  key={skill}
                  className="rounded-lg bg-[#162C66]/[0.06] px-3 py-1.5"
                >
                  <Text className="text-[12px] font-bold text-[#162C66]">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ─── Premium gate notice (employer non-premium) ─── */}
        {!isOwn && !canContact && session ? (
          <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-[#162C66] p-5">
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F5C400]/15">
                <Lock color="#F5C400" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-extrabold text-white">
                  {c.premiumLockTitle}
                </Text>
                <Text className="mt-0.5 text-[12px] text-white/60">
                  {c.premiumLockDesc}
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
        {isOwn ? (
          <Pressable
            onPress={() => router.push(`/ad/edit/${id}` as any)}
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
              {c.edit}
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
                  {c.contact(firstName || 'Candidate')}
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
              {c.premiumCta}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
