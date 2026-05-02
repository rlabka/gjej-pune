/**
 * Firebase Google Sign-In for Expo Go.
 *
 * Flow:
 *   1. expo-auth-session/providers/google → user authenticates with Google
 *   2. Returns a raw Google ID token
 *   3. Exchange via Firebase REST `accounts:signInWithIdp` for a Firebase ID token
 *   4. Send Firebase ID token to backend `/api/auth/google` (existing endpoint
 *      uses firebase-admin to verify)
 *
 * Required env vars (read via expo-constants extras / process.env):
 *   - EXPO_PUBLIC_FIREBASE_API_KEY            (Firebase project API key — public)
 *   - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID        (OAuth 2.0 Web client ID from Firebase)
 *   - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID        (optional, for native iOS build)
 *   - EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID    (optional, for native Android build)
 *
 * For Expo Go testing only the WEB client ID is required.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export const isGoogleAuthConfigured = !!(GOOGLE_WEB_CLIENT_ID && FIREBASE_API_KEY);

/**
 * Hook that returns a Google OAuth promptAsync function and the response.
 * Call this at the top of your component, then `promptAsync()` on user tap.
 */
export function useGoogleAuthRequest() {
  return Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    // Expo Go uses the proxy automatically when standalone client IDs are missing.
    // For native builds the iOS/Android client IDs above are used.
  });
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
    requestUri: 'http://localhost',
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
