import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useI18n } from '@/contexts/I18nContext';
import { TabBar } from '@/components/TabBar';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function TabsLayout() {
  const { session, isLoading } = useAuth();
  const { unreadCount: chatUnread } = useChat();
  const { t } = useI18n();
  const [notifUnread, setNotifUnread] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll backend for notification unread count so the bottom tab badge stays
  // fresh even when the user is on Home/Search/Chat. Web uses sockets; mobile
  // polls every 30 s + on app foreground (cheap, single small request).
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const token = (await getToken()) ?? undefined;
        if (!token) return;
        const res = await api.get<{ ok: boolean; count: number }>(
          '/api/notifications/unread-count',
          token
        );
        if (!cancelled && res?.ok) setNotifUnread(res.count ?? 0);
      } catch {
        /* ignore */
      }
    };
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 30_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') fetchUnread();
    });
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      sub.remove();
    };
  }, [session]);

  if (isLoading) return null;
  if (!session) return <Redirect href={'/welcome' as any} />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('Mobile.tabs.home') }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: t('Mobile.tabs.browse') }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('Mobile.tabs.chat'),
          tabBarBadge:
            chatUnread > 0 ? (chatUnread > 99 ? '99+' : chatUnread) : undefined,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('Mobile.tabs.inbox'),
          tabBarBadge:
            notifUnread > 0 ? (notifUnread > 99 ? '99+' : notifUnread) : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('Mobile.tabs.profile') }}
      />
    </Tabs>
  );
}
