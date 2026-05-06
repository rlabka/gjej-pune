import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import { getToken } from './auth';
import { storage } from './storage';

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

const SOFT_PROMPT_FLAG_KEY = 'push.softPromptShown';

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

async function obtainAndRegisterToken(): Promise<string | null> {
  try {
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
    console.warn('[Push] obtain token failed:', err);
    return null;
  }
}

/**
 * Register the device for push iff iOS permission is already granted.
 * Never triggers the system permission dialog. Safe to call eagerly on
 * login — keeps existing-permission users covered without surprising
 * first-time users with an out-of-context iOS prompt (Apple flags this
 * pattern as bad UX in App Review).
 */
export async function registerIfAlreadyGranted(): Promise<string | null> {
  if (!Device.isDevice) return null;
  await ensureAndroidChannel();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status !== 'granted') return null;
  return obtainAndRegisterToken();
}

/**
 * Trigger the iOS/Android system permission dialog and register the
 * push token if the user grants it. Call this only AFTER the app has
 * presented its own custom rationale (soft-prompt) so the user sees
 * context before the system prompt appears.
 */
export async function requestPushPermissionAndRegister(): Promise<string | null> {
  if (!Device.isDevice) return null;
  await ensureAndroidChannel();
  const req = await Notifications.requestPermissionsAsync();
  if (req.status !== 'granted') return null;
  return obtainAndRegisterToken();
}

/**
 * Returns true if the in-app rationale ("soft-prompt") has been shown
 * before. Stored in SecureStore so it survives app reinstall on iOS
 * Keychain and respects user choice across sessions.
 */
export async function hasShownSoftPrompt(): Promise<boolean> {
  return (await storage.get(SOFT_PROMPT_FLAG_KEY)) === '1';
}

export async function markSoftPromptShown(): Promise<void> {
  await storage.set(SOFT_PROMPT_FLAG_KEY, '1');
}

/**
 * Whether to display the soft-prompt: only when the OS permission is
 * still `undetermined` (user has never been asked) AND we haven't
 * already shown our rationale.
 */
export async function shouldShowSoftPrompt(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status !== 'undetermined') return false;
  return !(await hasShownSoftPrompt());
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
