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
  MessageCircle,
  Search,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useI18n } from '@/contexts/I18nContext';
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
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="border-b border-slate-100 px-4 pb-3 pt-5">
          <Text className="mb-3 text-lg font-semibold text-[#0B1F44]">
            {t('Mobile.chat.title')}
          </Text>

          {/* Search */}
          <View className="mb-2.5 flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Search color="#94A3B8" size={16} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('Mobile.chat.searchPlaceholder')}
              placeholderTextColor="#94A3B8"
              className="ml-2 flex-1 py-2 text-[14px] text-[#0B1F44]"
              returnKeyType="search"
            />
          </View>

          {/* Filter pills */}
          <View className="flex-row" style={{ gap: 6 }}>
            <Pressable
              onPress={() => setFilter('all')}
              className={`rounded-full px-3 py-1 ${
                filter === 'all' ? 'bg-[#162C66]' : 'bg-slate-100'
              }`}
            >
              <Text
                className={`text-[12px] font-medium ${
                  filter === 'all' ? 'text-white' : 'text-slate-500'
                }`}
              >
                {t('Mobile.chat.filterAll')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('unread')}
              className={`flex-row items-center rounded-full px-3 py-1 ${
                filter === 'unread' ? 'bg-[#162C66]' : 'bg-slate-100'
              }`}
            >
              <Text
                className={`text-[12px] font-medium ${
                  filter === 'unread' ? 'text-white' : 'text-slate-500'
                }`}
              >
                {t('Mobile.chat.filterUnread')}
              </Text>
              {totalUnread > 0 ? (
                <View
                  className={`ml-1.5 h-4 min-w-[16px] items-center justify-center rounded-full px-1 ${
                    filter === 'unread' ? 'bg-white' : 'bg-[#162C66]'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold ${
                      filter === 'unread' ? 'text-[#162C66]' : 'text-white'
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
      </SafeAreaView>
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
      className="border-b border-slate-50 px-4 py-3.5 active:bg-slate-50"
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        {/* Avatar + online dot */}
        <View className="relative shrink-0">
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="cover"
            />
          ) : (
            <View
              className={`items-center justify-center rounded-full ${
                hasUnread ? 'bg-[#162C66]' : 'bg-slate-100'
              }`}
              style={{ width: 40, height: 40 }}
            >
              <Text
                className={`text-[13px] font-bold ${
                  hasUnread ? 'text-white' : 'text-[#162C66]'
                }`}
              >
                {initials}
              </Text>
            </View>
          )}
          <View
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
              online ? 'bg-emerald-400' : 'bg-slate-300'
            }`}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Row 1: name + time */}
          <View className="mb-0.5 flex-row items-baseline justify-between">
            <Text
              className={`flex-1 text-[13px] ${
                hasUnread
                  ? 'font-semibold text-[#0B1F44]'
                  : 'font-medium text-slate-700'
              }`}
              numberOfLines={1}
            >
              {item.partnerName}
            </Text>
            <Text className="ml-2 text-[11px] text-slate-400">
              {timeAgo(item.lastAt, t)}
            </Text>
          </View>

          {/* Row 2: job refs */}
          {visibleRefs.length > 0 ? (
            <View
              className="mb-0.5 flex-row items-center"
              style={{ gap: 4 }}
            >
              <Briefcase color="#94A3B8" size={11} />
              {visibleRefs.map((ref, i) => (
                <View
                  key={i}
                  className="rounded bg-slate-50 px-1.5 py-0.5"
                >
                  <Text
                    className="text-[11px] font-medium text-slate-500"
                    numberOfLines={1}
                    style={{ maxWidth: 100 }}
                  >
                    {ref.jobTitle}
                  </Text>
                </View>
              ))}
              {restRefs > 0 ? (
                <Text className="text-[10px] font-medium text-slate-400">
                  +{restRefs}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Row 3: last message + unread badge */}
          <View className="flex-row items-center justify-between">
            <Text
              className="flex-1 text-[12px] text-slate-400"
              numberOfLines={1}
            >
              {item.lastMessage ?? ''}
            </Text>
            {hasUnread ? (
              <View
                className="ml-2 items-center justify-center rounded-full bg-[#162C66]"
                style={{ width: 18, height: 18 }}
              >
                <Text className="text-[9px] font-bold text-white">
                  {item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
