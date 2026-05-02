import { Pressable, Text, View } from 'react-native';
import {
  Eye,
  MapPin,
  MoreVertical,
  Pencil,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { translateJobTitle } from '@/lib/jobTitle';
import type { Locale } from '@jmp/shared';
import type { JobItem } from '@/components/JobCard';

function formatSalary(item: JobItem): string {
  if (!item.salary || item.salary <= 0) return '—';
  const curr = item.currency ?? 'CHF';
  const type = (item.salaryType ?? 'Hour').toLowerCase();
  if (type === 'provision') return `${curr} ${item.salary}/provision`;
  const short =
    type === 'month' ? '/month' : type === 'year' ? '/year' : '/h';
  return `${curr} ${item.salary.toLocaleString()}${short}`;
}

function formatTimeAgo(
  iso: string | null | undefined,
  t: (k: string, o?: any) => string
): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return t('Mobile.myJobs.timeAgoJustNow');
  if (min < 60) return t('Mobile.myJobs.timeAgoMinutes', { minutes: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('Mobile.myJobs.timeAgoHours', { hours: h });
  const d = Math.floor(h / 24);
  return t('Mobile.myJobs.timeAgoDays', { days: d });
}

type Props = {
  item: JobItem;
  onPress: () => void;
  onEdit: () => void;
  onMore?: () => void;
  menuOpen?: boolean;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  onCloseMenu?: () => void;
  /** Hide the overflow (⋮) action when false. Default true. */
  showMore?: boolean;
};

export function MyJobRow({
  item,
  onPress,
  onEdit,
  onMore,
  menuOpen = false,
  onToggleStatus,
  onDelete,
  onCloseMenu,
  showMore = true,
}: Props) {
  const { t, locale } = useI18n();
  const title = translateJobTitle(item.category, locale as Locale);
  const status = (item.status ?? 'Active') as 'Active' | 'Paused' | 'Closed';
  const statusLabel =
    status === 'Paused'
      ? t('Mobile.myJobs.statusPaused')
      : status === 'Closed'
        ? t('Mobile.myJobs.statusClosed')
        : t('Mobile.myJobs.statusActive');
  const statusDot =
    status === 'Active'
      ? '#10B981'
      : status === 'Paused'
        ? '#F59E0B'
        : '#94A3B8';
  const statusBg =
    status === 'Active'
      ? 'bg-emerald-50'
      : status === 'Paused'
        ? 'bg-amber-50'
        : 'bg-slate-100';
  const statusText =
    status === 'Active'
      ? 'text-emerald-700'
      : status === 'Paused'
        ? 'text-amber-700'
        : 'text-slate-500';

  const location = [item.locationCity, item.locationState]
    .filter(Boolean)
    .join(', ');
  const timeAgo = formatTimeAgo(item.createdAt, t);

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 active:opacity-95"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View className="flex-row items-start">
        <Text
          className="flex-1 pr-2 text-[15px] font-extrabold text-[#0B1F44]"
          numberOfLines={2}
        >
          {title}
        </Text>
        <View
          className={`flex-row items-center rounded-full ${statusBg} px-2.5 py-1`}
        >
          <View
            className="mr-1.5 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusDot }}
          />
          <Text className={`text-[11px] font-bold ${statusText}`}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View className="mt-1 flex-row items-center">
        {location ? (
          <>
            <MapPin color="#94A3B8" size={12} />
            <Text
              className="ml-1 text-[12px] text-slate-400"
              numberOfLines={1}
            >
              {location}
            </Text>
          </>
        ) : null}
        {location && timeAgo ? (
          <Text className="mx-1.5 text-[12px] text-slate-400">•</Text>
        ) : null}
        {timeAgo ? (
          <Text className="text-[12px] text-slate-400">{timeAgo}</Text>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="text-[14px] font-extrabold text-[#0B1F44]">
            {formatSalary(item)}
          </Text>
          <View className="ml-3 flex-row items-center">
            <Eye color="#94A3B8" size={12} />
            <Text className="ml-1 text-[12px] font-semibold text-slate-400">
              {item.views ?? 0}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center" style={{ gap: 4 }}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onPress();
            }}
            className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100"
          >
            <Eye color="#64748B" size={16} />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100"
          >
            <Pencil color="#64748B" size={16} />
          </Pressable>
          {showMore && onMore ? (
            <View className="relative">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  menuOpen ? onCloseMenu?.() : onMore();
                }}
                className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100"
              >
                <MoreVertical color="#64748B" size={16} />
              </Pressable>
              {menuOpen ? (
                <View
                  className="absolute right-0 top-9 z-50 min-w-[160px] overflow-hidden rounded-xl border border-slate-100 bg-white"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 6,
                  }}
                >
                  {onToggleStatus ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onToggleStatus();
                      }}
                      className="border-b border-slate-100 px-4 py-2.5 active:bg-slate-50"
                    >
                      <Text className="text-[13px] font-semibold text-[#0B1F44]">
                        {status === 'Active'
                          ? t('Mobile.myJobs.pause')
                          : t('Mobile.myJobs.activate')}
                      </Text>
                    </Pressable>
                  ) : null}
                  {onDelete ? (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="px-4 py-2.5 active:bg-rose-50"
                    >
                      <Text className="text-[13px] font-semibold text-rose-600">
                        {t('Mobile.myJobs.delete')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
