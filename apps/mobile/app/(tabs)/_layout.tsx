import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useI18n } from '@/contexts/I18nContext';
import { TabBar } from '@/components/TabBar';

export default function TabsLayout() {
  const { session, isLoading } = useAuth();
  const { unreadCount } = useChat();
  const { t } = useI18n();

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
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: t('Mobile.tabs.inbox') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('Mobile.tabs.profile') }}
      />
    </Tabs>
  );
}
