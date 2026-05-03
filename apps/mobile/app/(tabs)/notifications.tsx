import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOGO_IMAGE = require('../../assets/images/logo.png');
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  BellOff,
  Briefcase,
  CheckCheck,
  Crown,
  Eye,
  MessageSquare,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getNotifTitle, getNotifBody } from '@/lib/notificationLocale';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  meta: string;
  createdAt: string;
};

type ListResponse = {
  ok: boolean;
  notifications: Notification[];
  nextCursor: string | null;
};

type FilterType = 'all' | 'unread' | 'messages' | 'activity';

type Group = {
  key: string;
  label: string;
  items: Notification[];
};

type ListRow =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'item'; key: string; notification: Notification };

const ICON_MAP: Record<
  string,
  { Icon: LucideIcon; color: string; bg: string; ring: string }
> = {
  profile_view: { Icon: Eye, color: '#2563EB', bg: '#EFF6FF', ring: '#DBEAFE' },
  new_message: {
    Icon: MessageSquare,
    color: '#059669',
    bg: '#ECFDF5',
    ring: '#D1FAE5',
  },
  premium_activated: {
    Icon: Crown,
    color: '#D97706',
    bg: '#FFFBEB',
    ring: '#FDE68A',
  },
  premium_cancelled: {
    Icon: Star,
    color: '#64748B',
    bg: '#F1F5F9',
    ring: '#E2E8F0',
  },
  boost_active: { Icon: Zap, color: '#9333EA', bg: '#F5F3FF', ring: '#DDD6FE' },
  ad_online: {
    Icon: Briefcase,
    color: '#059669',
    bg: '#ECFDF5',
    ring: '#D1FAE5',
  },
};

function getIcon(type: string) {
  return (
    ICON_MAP[type] ?? {
      Icon: Bell,
      color: '#64748B',
      bg: '#F1F5F9',
      ring: '#E2E8F0',
    }
  );
}

function formatRelative(
  iso: string,
  t: (k: string, o?: any) => string
): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('Mobile.inbox.timeNow');
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function groupNotifications(
  items: Notification[],
  t: (k: string, o?: any) => string
): Group[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 24 * 3600 * 1000;
  const weekAgo = today - 7 * 24 * 3600 * 1000;

  const todayItems: Notification[] = [];
  const yesterdayItems: Notification[] = [];
  const weekItems: Notification[] = [];
  const olderItems: Notification[] = [];

  for (const n of items) {
    const ts = new Date(n.createdAt).getTime();
    if (ts >= today) todayItems.push(n);
    else if (ts >= yesterday) yesterdayItems.push(n);
    else if (ts >= weekAgo) weekItems.push(n);
    else olderItems.push(n);
  }

  const groups: Group[] = [];
  if (todayItems.length)
    groups.push({
      key: 'today',
      label: t('Mobile.inbox.groupToday'),
      items: todayItems,
    });
  if (yesterdayItems.length)
    groups.push({
      key: 'yesterday',
      label: t('Mobile.inbox.groupYesterday'),
      items: yesterdayItems,
    });
  if (weekItems.length)
    groups.push({
      key: 'week',
      label: t('Mobile.inbox.groupThisWeek'),
      items: weekItems,
    });
  if (olderItems.length)
    groups.push({
      key: 'older',
      label: t('Mobile.inbox.groupOlder'),
      items: olderItems,
    });

  return groups;
}

export default function NotificationsScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const load = useCallback(
    async (append = false, afterCursor?: string) => {
      const token = (await getToken()) ?? undefined;
      if (!token) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      try {
        const qs = afterCursor
          ? `?cursor=${afterCursor}&limit=20`
          : '?limit=20';
        const res = await api.get<ListResponse>(
          `/api/notifications${qs}`,
          token
        );
        if (res?.ok) {
          if (append) {
            setItems((prev) => [...prev, ...res.notifications]);
          } else {
            setItems(res.notifications ?? []);
          }
          setCursor(res.nextCursor ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function markAllRead() {
    const token = (await getToken()) ?? undefined;
    if (!token) return;
    try {
      await api.put('/api/notifications/read-all', {}, token);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    }
  }

  async function markRead(id: string) {
    const token = (await getToken()) ?? undefined;
    if (!token) return;
    try {
      await api.put(`/api/notifications/${id}/read`, {}, token);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      /* ignore */
    }
  }

  function onTap(item: Notification) {
    if (!item.read) markRead(item.id);

    let meta: Record<string, any> = {};
    try {
      meta = JSON.parse(item.meta);
    } catch {
      /* ignore */
    }

    if (item.type === 'new_message' && meta.conversationId) {
      router.push(`/chat/${meta.conversationId}` as any);
    } else if (item.type === 'profile_view') {
      // Profile views are premium-gated — always route to the dedicated
      // /profile-views screen (which renders locked state for non-premium).
      router.push('/profile-views' as any);
    } else if (item.type === 'ad_online' && meta.targetType === 'ad' && meta.targetId) {
      router.push(`/ad/${meta.targetId}` as any);
    } else if (item.type === 'ad_online' && meta.targetType === 'job' && meta.targetId) {
      router.push(`/job/${meta.targetId}` as any);
    } else if (
      (item.type === 'premium_activated' || item.type === 'premium_cancelled' || item.type === 'boost_active')
    ) {
      router.push('/premium' as any);
    }
  }

  const unreadCount = items.filter((n) => !n.read).length;
  const messagesCount = items.filter((n) => n.type === 'new_message').length;
  const activityCount = items.filter((n) => n.type !== 'new_message').length;

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unread':
        return items.filter((n) => !n.read);
      case 'messages':
        return items.filter((n) => n.type === 'new_message');
      case 'activity':
        return items.filter((n) => n.type !== 'new_message');
      default:
        return items;
    }
  }, [items, filter]);

  const rows: ListRow[] = useMemo(() => {
    const groups = groupNotifications(filtered, t);
    const out: ListRow[] = [];
    for (const g of groups) {
      out.push({ kind: 'header', key: `h-${g.key}`, label: g.label });
      for (const n of g.items) {
        out.push({ kind: 'item', key: n.id, notification: n });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const subtitle =
    unreadCount === 0
      ? t('Mobile.inbox.allRead')
      : unreadCount === 1
        ? t('Mobile.inbox.unreadSubtitleOne')
        : t('Mobile.inbox.unreadSubtitleMany', { count: unreadCount });

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      {/* Top bar with logo — consistent across tabs */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View
          className="flex-row items-center justify-center border-b border-slate-200/70 bg-white px-4 py-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Image
            source={LOGO_IMAGE}
            style={{ height: 28, width: 110 }}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
      <View className="flex-1">
        {/* Section header — title row + filter pills */}
        <View className="bg-white px-5 pb-4 pt-5">
          <View className="mb-4 flex-row items-center" style={{ gap: 12 }}>
            <View className="relative">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]">
                <Bell color="#F5C400" size={20} />
              </View>
              {unreadCount > 0 ? (
                <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1">
                  <Text className="text-[10px] font-extrabold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="text-[22px] font-extrabold leading-tight tracking-tight text-[#0B1F44]">
                {t('Mobile.inbox.title')}
              </Text>
              <Text className="mt-0.5 text-[12px] font-medium text-slate-400">
                {subtitle}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <Pressable
                onPress={markAllRead}
                className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:opacity-80"
              >
                <CheckCheck color="#162C66" size={14} />
                <Text className="ml-1.5 text-[11px] font-bold text-[#0B1F44]">
                  {t('Mobile.inbox.markAllRead')}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Filter chips — horizontally scrollable so they don't get cramped */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <FilterChip
              label={t('Mobile.inbox.filterAll')}
              count={items.length}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <FilterChip
              label={t('Mobile.inbox.filterUnread')}
              count={unreadCount}
              active={filter === 'unread'}
              highlight
              onPress={() => setFilter('unread')}
            />
            <FilterChip
              label={t('Mobile.inbox.filterMessages')}
              count={messagesCount}
              active={filter === 'messages'}
              onPress={() => setFilter('messages')}
            />
            <FilterChip
              label={t('Mobile.inbox.filterActivity')}
              count={activityCount}
              active={filter === 'activity'}
              onPress={() => setFilter('activity')}
            />
          </ScrollView>
        </View>

        <FlatList
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 100,
          }}
          data={rows}
          keyExtractor={(row) => row.key}
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return (
                <View className="mb-2 mt-3 first:mt-0">
                  <Text className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </Text>
                </View>
              );
            }
            return (
              <NotificationRow
                item={item.notification}
                onPress={() => onTap(item.notification)}
                t={t}
                locale={locale}
              />
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
          onEndReached={() => {
            if (cursor && !loadingMore) {
              setLoadingMore(true);
              load(true, cursor);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator color="#162C66" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <SkeletonList />
            ) : (
              <EmptyState
                filter={filter}
                title={
                  filter === 'unread'
                    ? t('Mobile.inbox.emptyUnread')
                    : t('Mobile.inbox.empty')
                }
                desc={
                  filter === 'unread'
                    ? t('Mobile.inbox.emptyUnreadDesc')
                    : t('Mobile.inbox.emptyDesc')
                }
              />
            )
          }
        />
      </View>
    </View>
  );
}

function FilterChip({
  label,
  count,
  active,
  highlight,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  highlight?: boolean;
  onPress: () => void;
}) {
  const hasCount = typeof count === 'number' && count > 0;
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-xl px-3 py-2 active:opacity-80 ${
        active
          ? 'bg-[#0B1F44]'
          : 'border border-slate-200 bg-white'
      }`}
    >
      <Text
        className={`text-[12px] font-bold ${
          active ? 'text-white' : 'text-[#0B1F44]'
        }`}
      >
        {label}
      </Text>
      {hasCount ? (
        <View
          className={`ml-1.5 h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 ${
            active
              ? 'bg-white'
              : highlight && count && count > 0
                ? 'bg-rose-500'
                : 'bg-slate-100'
          }`}
        >
          <Text
            className={`text-[10px] font-extrabold ${
              active
                ? 'text-[#0B1F44]'
                : highlight && count && count > 0
                  ? 'text-white'
                  : 'text-slate-500'
            }`}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function NotificationRow({
  item,
  onPress,
  t,
  locale,
}: {
  item: Notification;
  onPress: () => void;
  t: (k: string, o?: any) => string;
  locale: string;
}) {
  const { Icon, color, bg, ring } = getIcon(item.type);
  const isUnread = !item.read;

  // Use the localized title/body, falling back to raw values from API
  const title = getNotifTitle(item, locale);
  const body = getNotifBody(item, locale);

  return (
    <Pressable
      onPress={onPress}
      className={`mb-2 flex-row rounded-2xl border p-4 active:opacity-95 ${
        isUnread ? 'border-[#162C66]/15 bg-white' : 'border-slate-100 bg-white'
      }`}
      style={{
        shadowColor: '#0B1F44',
        shadowOffset: { width: 0, height: isUnread ? 4 : 1 },
        shadowOpacity: isUnread ? 0.06 : 0.02,
        shadowRadius: isUnread ? 10 : 4,
        elevation: isUnread ? 2 : 1,
      }}
    >
      {/* Left accent bar for unread */}
      {isUnread ? (
        <View
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
          style={{ backgroundColor: color }}
        />
      ) : null}

      {/* Icon bubble */}
      <View className="shrink-0" style={{ marginLeft: isUnread ? 4 : 0 }}>
        <View
          className="h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: bg,
            borderWidth: 1,
            borderColor: ring,
          }}
        >
          <Icon color={color} size={18} />
        </View>
      </View>

      <View className="ml-3 flex-1">
        <View className="flex-row items-start justify-between">
          <Text
            className={`flex-1 text-[14px] leading-tight ${
              isUnread
                ? 'font-extrabold text-[#0B1F44]'
                : 'font-bold text-[#0B1F44]'
            }`}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View className="ml-2 flex-row items-center">
            <Text className="text-[11px] font-medium text-slate-400">
              {formatRelative(item.createdAt, t)}
            </Text>
            {isUnread ? (
              <View
                className="ml-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
            ) : null}
          </View>
        </View>
        <Text
          className={`mt-1 text-[13px] leading-relaxed ${
            isUnread ? 'text-slate-600' : 'text-slate-500'
          }`}
          numberOfLines={2}
        >
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({
  filter,
  title,
  desc,
}: {
  filter: FilterType;
  title: string;
  desc: string;
}) {
  const isUnread = filter === 'unread';
  const Icon = isUnread ? Sparkles : BellOff;
  const iconBg = isUnread ? '#ECFDF5' : '#F1F5F9';
  const iconColor = isUnread ? '#059669' : '#94A3B8';

  return (
    <View className="mt-16 items-center px-6">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: iconBg }}
      >
        <Icon color={iconColor} size={28} />
      </View>
      <Text className="mb-1 text-lg font-bold text-[#0B1F44]">{title}</Text>
      <Text className="max-w-[280px] text-center text-sm text-slate-400">
        {desc}
      </Text>
    </View>
  );
}

function SkeletonList() {
  return (
    <View>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          className="mb-2 flex-row items-center rounded-2xl border border-slate-100 bg-white p-3.5"
        >
          <View className="h-10 w-10 rounded-xl bg-slate-100" />
          <View className="ml-3 flex-1">
            <View className="h-3.5 w-3/4 rounded-md bg-slate-100" />
            <View className="mt-2 h-3 w-1/2 rounded-md bg-slate-100" />
          </View>
        </View>
      ))}
    </View>
  );
}
