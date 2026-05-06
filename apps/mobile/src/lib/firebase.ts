/**
 * Google Sign-In via the native Google SDK (@react-native-google-signin/google-signin).
 *
 * Why native and not expo-auth-session: Google requires iOS client IDs to use their
 * native SDK flow (custom URL scheme + GIDSignIn). expo-auth-session/providers/google
 * works only in Expo Go / web because it uses the OAuth proxy. On native builds it
 * silently returns an empty id_token, which is what we hit in Build #14–#16.
 *
 * Spotify/Netflix/Uber/Airbnb all use this native pattern (or the underlying
 * GIDSignIn directly).
 *
 * Flow:
 *   1. GoogleSignin.signIn() → opens native Google Sign-In sheet, returns
 *      { idToken, user: { email, name, ... } }
 *   2. Exchange idToken via Firebase REST `accounts:signInWithIdp` for a
 *      Firebase ID token
 *   3. Send Firebase ID token to backend `/api/auth/google` (existing endpoint
 *      uses firebase-admin to verify)
 *
 * Required env vars:
 *   - EXPO_PUBLIC_FIREBASE_API_KEY            (Firebase project Web API key)
 *   - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID        (Web OAuth client ID; passed as
 *                                              webClientId so id_token uses the
 *                                              right audience for Firebase)
 *   - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID        (iOS OAuth client ID; SDK uses
 *                                              this implicitly via Info.plist)
 */

import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const isGoogleAuthConfigured = !!(GOOGLE_WEB_CLIENT_ID && FIREBASE_API_KEY);

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    // webClientId is what Firebase needs as audience — the id_token will be
    // issued for this client, which matches our Firebase project's OAuth setup.
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  });
  configured = true;
}

export type GoogleSignInResult =
  | { type: 'success'; idToken: string; email: string; displayName: string | null }
  | { type: 'cancelled' }
  | { type: 'error'; code: string; message: string };

/**
 * Trigger native Google Sign-In sheet. Returns a discriminated union so the
 * caller can render a verbose error if needed.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isGoogleAuthConfigured) {
    return {
      type: 'error',
      code: 'notConfigured',
      message:
        'Google login ist noch nicht konfiguriert. EXPO_PUBLIC_FIREBASE_API_KEY und EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID setzen.',
    };
  }
  try {
    ensureConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    // v16+ returns { type: 'success' | 'cancelled', data: {...} }
    const r: any = result;
    if (r?.type === 'cancelled') return { type: 'cancelled' };
    const data = r?.data ?? r;
    const idToken: string | null = data?.idToken ?? null;
    if (!idToken) {
      return { type: 'error', code: 'noIdToken', message: 'Google gab kein ID-Token zurück.' };
    }
    const user = data?.user ?? data;
    return {
      type: 'success',
      idToken,
      email: user?.email ?? '',
      displayName: user?.name ?? user?.displayName ?? null,
    };
  } catch (err: any) {
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) return { type: 'cancelled' };
    if (err?.code === statusCodes.IN_PROGRESS) {
      return { type: 'error', code: 'inProgress', message: 'Sign-In läuft bereits.' };
    }
    if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { type: 'error', code: 'noPlayServices', message: 'Google Play Services nicht verfügbar.' };
    }
    return {
      type: 'error',
      code: err?.code || 'unknown',
      message: err?.message || String(err),
    };
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    if (configured) await GoogleSignin.signOut();
  } catch {
    /* ignore */
  }
}

type IdpResponse = {
  idToken?: string;
  email?: string;
  displayName?: string;
  fullName?: string;
  error?: { message?: string };
};

/**
 * Exchange a Google ID token for a Firebase ID token via Firebase Auth REST API.
 * The returned `idToken` is what the backend's firebase-admin SDK expects.
 */
export async function exchangeGoogleTokenForFirebase(
  googleIdToken: string
): Promise<{
  firebaseIdToken: string;
  email: string;
  displayName: string | null;
}> {
  if (!FIREBASE_API_KEY) {
    throw new Error('EXPO_PUBLIC_FIREBASE_API_KEY is not set');
  }
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`;
  const body = {
    postBody: `id_token=${googleIdToken}&providerId=google.com`,
    requestUri: 'https://gjej-pune.com',
    returnSecureToken: true,
    returnIdpCredential: true,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: IdpResponse = await res.json();
  if (!data.idToken) {
    const msg = data.error?.message ?? `signInWithIdp failed (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return {
    firebaseIdToken: data.idToken,
    email: data.email ?? '',
    displayName: data.displayName ?? data.fullName ?? null,
  };
}
