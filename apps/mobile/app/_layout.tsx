import '../global.css';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { initI18n } from '@/i18n';
import { OnboardingGuard } from '@/components/OnboardingGuard';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initI18n();
      setReady(true);
      await SplashScreen.hideAsync().catch(() => {});
    })();
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <AuthProvider>
            <ChatProvider>
              <StatusBar style="auto" />
              <OnboardingGuard>
                <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="job/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="ad/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="ad/new" options={{ presentation: 'modal' }} />
                <Stack.Screen name="ad/edit/[id]" options={{ presentation: 'modal' }} />
                <Stack.Screen name="job/new" options={{ presentation: 'modal' }} />
                <Stack.Screen name="job/edit/[id]" options={{ presentation: 'modal' }} />
                <Stack.Screen name="favorites" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="premium" />
                <Stack.Screen name="profile-views" />
                <Stack.Screen name="applications" />
                <Stack.Screen name="profile-edit" />
                <Stack.Screen name="legal/[type]" />
                <Stack.Screen name="contact" />
                <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
              </Stack>
              </OnboardingGuard>
            </ChatProvider>
          </AuthProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
