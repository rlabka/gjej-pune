import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Briefcase,
  Inbox as InboxIcon,
  MessageCircle,
  Search,
} from 'lucide-react-native';

const LOGO_IMAGE = require('../../assets/images/logo.png');
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useI18n } from '@/contexts/I18nContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';

type JobRef = { jobId: string | null; jobTitle: string | null };

type Conversation = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerImage: string | null;
  partnerRole: string;
  partnerOnline: boolean;
  partnerLastSeen: string | null;
  jobId: string | null;
  jobTitle: string | null;
  jobRefs?: JobRef[];
  lastMessage: string | null;
  lastAt: string;
  unreadCount: number;
  createdAt: string;
};

type ListResponse = { ok: boolean; conversations: Conversation[] };
type Filter = 'all' | 'unread';

function timeAgo(iso: string, t: (k: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('Mobile.chat.justNowShort');
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return t('Mobile.chat.yesterday');
  return `${days}d`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export default function ChatListScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuth();
  const { onMessage, isOnline, refreshUnread } = useChat();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const token = (await getToken()) ?? undefined;
    if (!token) {
      setConversations([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await api.get<ListResponse>('/api/messages/conversations', token);
      if (res?.ok) setConversations(res.conversations ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
      refreshUnread();
    }, [load, refreshUnread])
  );

  useEffect(() => {
    const unsub = onMessage(() => {
      load();
    });
    return unsub;
  }, [onMessage, load]);

  const totalUnread = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  const filtered = conversations.filter((c) => {
    if (filter === 'unread' && c.unreadCount === 0) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const matchName = c.partnerName.toLowerCase().includes(q);
    const matchJob = (c.jobTitle ?? '').toLowerCase().includes(q);
    const matchRefs = (c.jobRefs ?? []).some((r) =>
      (r.jobTitle ?? '').toLowerCase().includes(q)
    );
    return matchName || matchJob || matchRefs;
  });

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <MessageCircle color="#CBD5E1" size={28} />
        </View>
        <Text className="mb-1 text-lg font-bold text-[#0B1F44]">
          {t('Mobile.chat.empty')}
        </Text>
        <Text className="max-w-[280px] text-center text-sm text-slate-400">
          {t('Mobile.chat.emptyDesc')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      {/* Top bar with logo — consistent with login/register/search */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View
          className="flex-row items-center justify-between border-b border-slate-200/70 bg-white px-4 py-1"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View style={{ width: 60 }} />
          <Image
            source={LOGO_IMAGE}
            style={{ height: 56, width: 180 }}
            resizeMode="contain"
          />
          <LanguageSwitcher variant="light" />
        </View>
      </SafeAreaView>
      <View className="flex-1">
        {/* Section header — title + count + search + filters */}
        <View className="bg-white px-5 pb-4 pt-5">
          {/* Title row */}
          <View className="mb-4 flex-row items-center" style={{ gap: 12 }}>
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]/[0.06]">
              <InboxIcon color="#162C66" size={22} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="text-[22px] font-extrabold leading-tight tracking-tight text-[#0B1F44]">
                {t('Mobile.chat.title')}
              </Text>
              <Text className="mt-0.5 text-[12px] font-medium text-slate-400">
                {filtered.length} {filtered.length === 1 ? t('Mobile.chat.conversation') : t('Mobile.chat.conversations')}
              </Text>
            </View>
            {totalUnread > 0 ? (
              <View
                className="h-7 min-w-[28px] items-center justify-center rounded-full bg-[#F5C400] px-2"
                style={{
                  shadowColor: '#F5C400',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text className="text-[12px] font-extrabold text-[#0B1F44]">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Search input */}
          <View
            className="mb-3 h-[48px] flex-row items-center rounded-xl border border-slate-200 bg-slate-50/80"
            style={{ paddingHorizontal: 14 }}
          >
            <View className="h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white">
              <Search color="#64748B" size={14} />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('Mobile.chat.searchPlaceholder')}
              placeholderTextColor="#94A3B8"
              className="ml-3 flex-1 text-[14px] font-medium text-[#0B1F44]"
              style={{ height: '100%' }}
              returnKeyType="search"
            />
          </View>

          {/* Filter pills */}
          <View className="flex-row" style={{ gap: 8 }}>
            <Pressable
              onPress={() => setFilter('all')}
              className={`rounded-xl px-4 py-2 ${
                filter === 'all'
                  ? 'bg-[#162C66]'
                  : 'border border-slate-200 bg-white'
              }`}
              style={
                filter === 'all'
                  ? {
                      shadowColor: '#162C66',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.18,
                      shadowRadius: 8,
                      elevation: 3,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-[13px] font-bold ${
                  filter === 'all' ? 'text-white' : 'text-slate-600'
                }`}
              >
                {t('Mobile.chat.filterAll')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('unread')}
              className={`flex-row items-center rounded-xl px-4 py-2 ${
                filter === 'unread'
                  ? 'bg-[#162C66]'
                  : 'border border-slate-200 bg-white'
              }`}
              style={
                filter === 'unread'
                  ? {
                      shadowColor: '#162C66',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.18,
                      shadowRadius: 8,
                      elevation: 3,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-[13px] font-bold ${
                  filter === 'unread' ? 'text-white' : 'text-slate-600'
                }`}
              >
                {t('Mobile.chat.filterUnread')}
              </Text>
              {totalUnread > 0 ? (
                <View
                  className={`ml-2 h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 ${
                    filter === 'unread' ? 'bg-[#F5C400]' : 'bg-[#162C66]'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-extrabold ${
                      filter === 'unread' ? 'text-[#0B1F44]' : 'text-white'
                    }`}
                  >
                    {totalUnread}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <FlatList
          className="flex-1"
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              online={isOnline(item.partnerId) || item.partnerOnline}
              onPress={() => router.push(`/chat/${item.id}` as any)}
              t={t}
            />
          )}
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
          ListEmptyComponent={
            loading ? (
              <View className="mt-16 items-center">
                <ActivityIndicator color="#162C66" />
              </View>
            ) : (
              <View className="mt-16 items-center px-6">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <MessageCircle color="#CBD5E1" size={28} />
                </View>
                <Text className="mb-1 text-lg font-bold text-[#0B1F44]">
                  {t('Mobile.chat.empty')}
                </Text>
                <Text className="max-w-[280px] text-center text-sm text-slate-400">
                  {t('Mobile.chat.emptyDesc')}
                </Text>
              </View>
            )
          }
        />
      </View>
    </View>
  );
}

function ConversationRow({
  item,
  online,
  onPress,
  t,
}: {
  item: Conversation;
  online: boolean;
  onPress: () => void;
  t: (k: string) => string;
}) {
  const photo = resolveMediaUrl(config.apiUrl, item.partnerImage);
  const initials = getInitials(item.partnerName);
  const hasUnread = item.unreadCount > 0;

  const refs =
    item.jobRefs && item.jobRefs.length > 0
      ? item.jobRefs
      : item.jobTitle
        ? [{ jobId: item.jobId, jobTitle: item.jobTitle }]
        : [];
  const visibleRefs = refs.slice(0, 2);
  const restRefs = refs.length - 2;

  return (
    <Pressable
      onPress={onPress}
      className="border-b border-slate-100 px-4 py-4 active:bg-slate-50"
    >
      <View className="flex-row items-center" style={{ gap: 14 }}>
        {/* Avatar + online dot — bigger so the chat list reads as easily
            as LinkedIn / WhatsApp on a phone. */}
        <View className="relative shrink-0">
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{ width: 54, height: 54, borderRadius: 27 }}
              resizeMode="cover"
            />
          ) : (
            <View
              className={`items-center justify-center rounded-full ${
                hasUnread ? 'bg-[#162C66]' : 'bg-[#162C66]/10'
              }`}
              style={{ width: 54, height: 54 }}
            >
              <Text
                className={`text-[18px] font-extrabold ${
                  hasUnread ? 'text-white' : 'text-[#162C66]'
                }`}
              >
                {initials}
              </Text>
            </View>
          )}
          {online ? (
            <View
              className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
            />
          ) : null}
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Row 1: name + time */}
          <View className="mb-1 flex-row items-baseline justify-between">
            <Text
              className={`flex-1 text-[16px] tracking-tight ${
                hasUnread
                  ? 'font-extrabold text-[#0B1F44]'
                  : 'font-semibold text-[#0B1F44]'
              }`}
              numberOfLines={1}
            >
              {item.partnerName}
            </Text>
            <Text
              className={`ml-2 text-[12px] ${
                hasUnread
                  ? 'font-bold text-[#162C66]'
                  : 'font-medium text-slate-500'
              }`}
            >
              {timeAgo(item.lastAt, t)}
            </Text>
          </View>

          {/* Row 2: job refs (when this conversation is tied to job ads) */}
          {visibleRefs.length > 0 ? (
            <View
              className="mb-1.5 flex-row items-center"
              style={{ gap: 5 }}
            >
              <Briefcase color="#64748B" size={12} />
              {visibleRefs.map((ref, i) => (
                <View
                  key={i}
                  className="rounded-md bg-slate-100 px-2 py-0.5"
                >
                  <Text
                    className="text-[12px] font-semibold text-slate-600"
                    numberOfLines={1}
                    style={{ maxWidth: 110 }}
                  >
                    {ref.jobTitle}
                  </Text>
                </View>
              ))}
              {restRefs > 0 ? (
                <Text className="text-[11px] font-semibold text-slate-500">
                  +{restRefs}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Row 3: last message + unread badge */}
          <View className="flex-row items-center justify-between">
            <Text
              className={`flex-1 text-[14px] leading-snug ${
                hasUnread
                  ? 'font-semibold text-[#0B1F44]'
                  : 'font-medium text-slate-500'
              }`}
              numberOfLines={1}
            >
              {item.lastMessage ?? ''}
            </Text>
            {hasUnread ? (
              <View
                className="ml-2 items-center justify-center rounded-full bg-[#F5C400] px-1.5"
                style={{
                  height: 22,
                  minWidth: 22,
                  shadowColor: '#F5C400',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-[11px] font-extrabold text-[#0B1F44]">
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
