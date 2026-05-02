import { Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  ClockAlert,
  Crown,
  Eye,
  Heart,
  MapPin,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { config } from '@/lib/config';
import { useFavorites } from '@/lib/useFavorites';
import { useI18n } from '@/contexts/I18nContext';
import { translateJobTitle } from '@/lib/jobTitle';
import type { Locale } from '@jmp/shared';

export type JobItem = {
  id: string;
  category: string;
  salary?: number | null;
  salaryType?: string | null;
  currency?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  countryCode?: string | null;
  when?: string | null;
  description?: string | null;
  status?: string | null;
  views?: number | null;
  createdAt?: string | null;
  user?: { displayName?: string | null; isPremium?: boolean | null } | null;
  isBoosted?: boolean;
  matchScore?: number | null;
  isTopMatch?: boolean | null;
};

function formatSalary(item: JobItem): string {
  if (!item.salary || item.salary <= 0) return '—';
  const curr = item.currency ?? 'CHF';
  const type = (item.salaryType ?? 'Hour').toLowerCase();
  if (type === 'provision') return `${item.salary}%`;
  const short = type === 'month' ? '/mo' : type === 'year' ? '/yr' : '/h';
  return `${curr} ${item.salary.toLocaleString()}${short}`;
}

export function JobCard({ item }: { item: JobItem }) {
  const router = useRouter();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { locale } = useI18n();
  const isSaved = isFavorited('job', item.id);
  const salary = formatSalary(item);
  const title = translateJobTitle(item.category, locale as Locale);
  const location = [item.locationCity, item.locationState].filter(Boolean).join(', ');
  const urgent = item.when?.toLowerCase().includes('urgent');
  const matchPct =
    typeof item.matchScore === 'number'
      ? Math.min(100, Math.max(0, Math.round(item.matchScore)))
      : null;
  const matchColors = matchColorsFor(matchPct);

  async function handleShare() {
    try {
      const url = `${config.apiUrl.replace(/\/api$/, '')}/job/${item.id}`;
      await Share.share({
        message: `${title}${item.user?.displayName ? ` — ${item.user.displayName}` : ''}\n${url}`,
        url,
      });
    } catch {
      /* ignore */
    }
  }

  return (
    <Pressable
      onPress={() => router.push(`/job/${item.id}` as any)}
      className={`mb-4 overflow-hidden rounded-2xl border bg-white ${
        item.isBoosted ? 'border-[#F5C400]/60' : 'border-slate-200'
      } active:opacity-90`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {item.isBoosted ? (
        <View className="flex-row items-center gap-1 px-5 pt-3">
          <Crown color="#F5C400" size={13} />
          <Text className="text-[10px] font-bold uppercase tracking-wider text-[#F5C400]">
            Premium
          </Text>
        </View>
      ) : null}

      {matchPct !== null ? (
        <View
          className="flex-row items-center justify-between px-5 pt-3 pb-1"
          style={{ gap: 8 }}
        >
          <View
            className="flex-row items-center rounded-lg px-2 py-1"
            style={{ backgroundColor: matchColors.bg }}
          >
            <Zap color={matchColors.icon} size={11} />
            <Text
              className="ml-1 text-[10px] font-extrabold uppercase tracking-wider"
              style={{ color: matchColors.text }}
            >
              {matchPct}% Match
            </Text>
          </View>
          {item.isTopMatch ? (
            <View className="flex-row items-center rounded-lg bg-[#F5C400]/15 px-2 py-1">
              <Sparkles color="#B45309" size={10} />
              <Text className="ml-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                Top Match
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="p-5">
        {/* Row 1: Title + icons */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-extrabold text-[#0B1F44]" numberOfLines={2}>
              {title}
            </Text>
            {item.user?.displayName ? (
              <View className="mt-1 flex-row items-center">
                <Briefcase color="#94A3B8" size={12} />
                <Text className="ml-1 text-xs font-semibold text-slate-500" numberOfLines={1}>
                  {item.user.displayName}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite('job', item.id);
              }}
              className={`mr-2 h-9 w-9 items-center justify-center rounded-xl border active:opacity-70 ${
                isSaved
                  ? 'border-rose-300 bg-rose-100'
                  : 'border-rose-100 bg-rose-50/80'
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
              className="h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/80 active:opacity-70"
            >
              <Share2 color="#3B82F6" size={15} />
            </Pressable>
          </View>
        </View>

        {/* Row 2: Chips + Salary */}
        <View className="mt-5 flex-row flex-wrap items-center justify-between">
          <View className="flex-row flex-wrap" style={{ flexShrink: 1 }}>
            {location ? (
              <View className="mb-2 mr-2 flex-row items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                <MapPin color="#F59E0B" size={12} />
                <Text className="ml-1 text-[11px] font-bold text-amber-700" numberOfLines={1}>
                  {location}
                </Text>
              </View>
            ) : null}
            {item.when ? (
              <View
                className={`mb-2 mr-2 flex-row items-center rounded-lg border px-2.5 py-1.5 ${
                  urgent
                    ? 'border-red-200 bg-red-50'
                    : 'border-[#E9D5FF] bg-[#F4F0FF]'
                }`}
              >
                {urgent ? (
                  <ClockAlert color="#F87171" size={11} />
                ) : (
                  <CalendarClock color="#9333EA" size={11} />
                )}
                <Text
                  className={`ml-1 text-[11px] font-bold ${
                    urgent ? 'text-red-600' : 'text-[#6B21A8]'
                  }`}
                >
                  {item.when}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="mb-2 rounded-xl bg-[#EAFAF1] px-3 py-1.5">
            <Text className="text-[16px] font-extrabold tracking-tight text-[#0B8A5A]">
              {salary}
            </Text>
          </View>
        </View>

        {/* Row 3: Show more button */}
        <View className="mt-2 flex-row">
          <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
            <Eye color="#0B1F44" size={14} />
            <Text className="mx-1.5 text-[12px] font-bold text-[#0B1F44]">Details</Text>
            <ArrowRight color="#0B1F44" size={13} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function matchColorsFor(pct: number | null): {
  bg: string;
  text: string;
  icon: string;
} {
  if (pct === null) return { bg: '#F1F5F9', text: '#475569', icon: '#94A3B8' };
  if (pct >= 80) return { bg: '#ECFDF5', text: '#047857', icon: '#10B981' };
  if (pct >= 60) return { bg: '#EFF6FF', text: '#1D4ED8', icon: '#3B82F6' };
  if (pct >= 40) return { bg: '#FFFBEB', text: '#B45309', icon: '#F59E0B' };
  return { bg: '#F1F5F9', text: '#475569', icon: '#94A3B8' };
}
