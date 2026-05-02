import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { getToken } from './auth';

/**
 * Foreground behavior: show banner + list + sound for incoming pushes.
 * Badges are handled by the OS automatically from Expo's push payload.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Legacy fields (kept for compatibility across SDK minor versions)
    shouldShowAlert: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#162C66',
    sound: 'default',
  });
}

/**
 * Ask for permission and obtain an Expo push token, then register it
 * with the backend. Returns the token on success, or null.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('[Push] must run on a physical device');
      return null;
    }

    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') {
      console.warn('[Push] permission denied');
      return null;
    }

    // In Expo Go / dev builds without EAS project, projectId may be empty.
    // Pass it if we have it, otherwise let the SDK pick the default.
    const projectId =
      (Constants.expoConfig?.extra as any)?.eas?.projectId ||
      (Constants as any).easConfig?.projectId ||
      undefined;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse.data;
    if (!token) return null;

    const authToken = (await getToken()) ?? undefined;
    if (!authToken) return token;

    try {
      await api.post('/api/push/register', { token }, authToken);
    } catch (err) {
      console.warn('[Push] register failed:', err);
    }

    return token;
  } catch (err) {
    console.warn('[Push] registerForPushNotifications failed:', err);
    return null;
  }
}

export async function unregisterPushToken(token: string): Promise<void> {
  try {
    const authToken = (await getToken()) ?? undefined;
    if (!authToken) return;
    await api.post('/api/push/unregister', { token }, authToken);
  } catch {
    /* ignore */
  }
}
