import { Image, Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Briefcase,
  Eye,
  Heart,
  MapPin,
  Share2,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';
import { useFavorites } from '@/lib/useFavorites';
import { translateJobTitle } from '@/lib/jobTitle';
import type { Locale } from '@jmp/shared';

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

function parseLanguages(
  value: AdItem['spokenLanguages']
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type AdItem = {
  id: string;
  category: string;
  firstName?: string | null;
  surname?: string | null;
  age?: number | null;
  photoUrl?: string | null;
  experience?: string | null;
  livingPlace?: string | null;
  skills?: string[] | string | null;
  spokenLanguages?: string[] | string | null;
  user?: { displayName?: string | null; isPremium?: boolean | null } | null;
};

function parseSkills(value: AdItem['skills']): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatExperience(value: string | null | undefined, t: (k: string, o?: any) => string): string | null {
  if (!value) return null;
  const match = value.match(/(\d+)/);
  if (match) {
    const years = match[1];
    return t('Mobile.browse.yearsExperience', { years });
  }
  return value;
}

export function AdCard({ item }: { item: AdItem }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { isFavorited, toggleFavorite } = useFavorites();
  const isSaved = isFavorited('ad', item.id);
  const photo = resolveMediaUrl(config.apiUrl, item.photoUrl);
  const firstName = item.firstName || 'Candidate';
  const title = translateJobTitle(item.category, locale as Locale);
  const skills = parseSkills(item.skills).slice(0, 3);
  const languages = parseLanguages(item.spokenLanguages);
  const experience = formatExperience(item.experience, t);

  async function handleShare() {
    try {
      const url = `${config.apiUrl.replace(/\/api$/, '')}/ad/${item.id}`;
      await Share.share({
        message: `${title} — ${firstName}${item.age ? `, ${item.age}` : ''}\n${url}`,
        url,
      });
    } catch {
      /* ignore */
    }
  }

  return (
    <Pressable
      onPress={() => router.push(`/ad/${item.id}` as any)}
      className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="p-4">
        {/* Top: photo + right content */}
        <View className="flex-row">
          {photo ? (
            <Image
              source={{ uri: photo }}
              className="h-[88px] w-[88px] rounded-2xl"
              resizeMode="cover"
            />
          ) : (
            <View className="h-[88px] w-[88px] items-center justify-center rounded-2xl bg-[#162C66]/5">
              <UserIcon color="#162C66" size={30} />
            </View>
          )}

          <View className="ml-3 flex-1">
            {/* Title + Heart + Share */}
            <View className="flex-row items-start">
              <Text
                className="flex-1 pr-2 text-[17px] font-extrabold leading-6 text-[#0B1F44]"
                numberOfLines={2}
              >
                {title}
              </Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite('ad', item.id);
                }}
                className={`mr-1.5 h-9 w-9 items-center justify-center rounded-xl border active:opacity-70 ${
                  isSaved
                    ? 'border-rose-300 bg-rose-100'
                    : 'border-rose-100 bg-rose-50'
                }`}
              >
                <Heart
                  color="#F43F5E"
                  fill={isSaved ? '#F43F5E' : 'transparent'}
                  size={15}
                  strokeWidth={isSaved ? 2 : 2.4}
                />
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 active:opacity-70"
              >
                <Share2 color="#3B82F6" size={15} />
              </Pressable>
            </View>

            {/* Name, age */}
            <View className="mt-1 flex-row items-center">
              <UserIcon color="#94A3B8" size={13} />
              <Text
                className="ml-1 text-[13px] font-semibold text-slate-500"
                numberOfLines={1}
              >
                {firstName}
                {item.age ? `, ${item.age}` : ''}
              </Text>
            </View>

            {/* Experience + Languages row */}
            {experience || languages.length > 0 ? (
              <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 6 }}>
                {experience ? (
                  <View className="flex-row items-center rounded-lg bg-emerald-50 px-2.5 py-1">
                    <Briefcase color="#10B981" size={12} />
                    <Text
                      className="ml-1 text-[11px] font-bold text-emerald-700"
                      numberOfLines={1}
                    >
                      {experience}
                    </Text>
                  </View>
                ) : null}
                {languages.length > 0 ? (
                  <View className="flex-row items-center rounded-lg bg-slate-50 px-2 py-1">
                    {languages.slice(0, 3).map((l) => (
                      <Text key={l} className="mr-0.5 text-[13px]">
                        {LANG_FLAGS[l] || '🌐'}
                      </Text>
                    ))}
                    {languages.length > 3 ? (
                      <Text className="ml-0.5 text-[10px] font-semibold text-slate-400">
                        +{languages.length - 3}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* Location + skills row */}
        {item.livingPlace || skills.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap" style={{ gap: 6 }}>
            {item.livingPlace ? (
              <View className="flex-row items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                <MapPin color="#F59E0B" size={12} />
                <Text
                  className="ml-1 text-[11px] font-bold text-amber-700"
                  numberOfLines={1}
                >
                  {item.livingPlace}
                </Text>
              </View>
            ) : null}
            {skills.map((s) => (
              <View
                key={s}
                className="flex-row items-center rounded-lg border border-[#E9D5FF] bg-[#F4F0FF] px-2.5 py-1.5"
              >
                <Sparkles color="#9333EA" size={11} />
                <Text className="ml-1 text-[11px] font-bold text-[#6B21A8]">
                  {s}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Show more button */}
        <Pressable
          onPress={() => router.push(`/ad/${item.id}` as any)}
          className="mt-3 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 active:opacity-80"
        >
          <Eye color="#0B1F44" size={14} />
          <Text className="mx-1.5 text-[12px] font-bold text-[#0B1F44]">
            {t('Mobile.browse.showMore')}
          </Text>
          <ArrowRight color="#0B1F44" size={13} />
        </Pressable>
      </View>
    </Pressable>
  );
}
