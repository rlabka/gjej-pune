/**
 * Auth client – calls the Express backend API.
 *
 * Ported from apps/web/src/lib/auth.ts. Key differences:
 *   - Tokens live in expo-secure-store (Keychain / Keystore), not localStorage
 *   - All APIs are async (SecureStore has no sync API)
 *   - No `window` checks
 */

import { config } from './config';
import { storage } from './storage';

export type AuthRole = 'job-seeker' | 'employer' | 'admin';

export type StoredSession = {
  isAuthenticated: boolean;
  role: AuthRole;
  email: string;
  displayName?: string;
  userId?: string;
  isPremium?: boolean;
};

const SESSION_KEY = 'auth.session';
const TOKEN_KEY = 'auth.token';

const API_URL = config.apiUrl;

// ─── Safe response helpers ────────────────────────────────────

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('[Auth] Non-JSON response:', res.status, text.slice(0, 300));
    return null;
  }
}

function classifyError(err: unknown): string {
  if (
    err instanceof TypeError &&
    (err.message.includes('fetch') ||
      err.message.includes('network') ||
      err.message.includes('Network request failed'))
  ) {
    return 'networkError';
  }
  console.error('[Auth] Unexpected error:', err);
  return 'serverError';
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/** Derive display name from email (e.g. imad.ed-din@x.com → "Imad Ed-din") */
export function displayNameFromEmail(email: string): string {
  const part = email.split('@')[0];
  if (!part) return 'Account';
  const words = part.replace(/_/g, '.').split('.').filter(Boolean);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function getDisplayName(session: StoredSession): string {
  if (session.displayName) return session.displayName;
  return displayNameFromEmail(session.email);
}

// ─── Token ────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return storage.get(TOKEN_KEY);
}

async function saveToken(token: string): Promise<void> {
  await storage.set(TOKEN_KEY, token);
}

// ─── Session ──────────────────────────────────────────────────

export async function getSession(): Promise<StoredSession | null> {
  const raw = await storage.get(SESSION_KEY);
  const session = safeParse<StoredSession>(raw);
  if (!session?.isAuthenticated || !session.role || !session.email) return null;
  return session;
}

async function saveSession(
  role: AuthRole,
  email: string,
  displayName?: string,
  userId?: string,
  isPremium?: boolean
): Promise<void> {
  const session: StoredSession = {
    isAuthenticated: true,
    role,
    email,
    displayName,
    userId,
    isPremium: isPremium ?? false,
  };
  await storage.set(SESSION_KEY, JSON.stringify(session));
}

// ─── Register ─────────────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  role: AuthRole,
  displayName?: string,
  locale?: string
): Promise<{ ok: true; role: AuthRole } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, displayName, locale }),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'registrationFailed' };

    if (data.token) await saveToken(data.token);
    const user = data.user;
    const userRole = (user?.role || role) as AuthRole;
    const name = user?.displayName || displayName || displayNameFromEmail(email);
    await saveSession(
      userRole,
      user?.email || email.toLowerCase().trim(),
      name,
      user?.id,
      user?.isPremium
    );

    return { ok: true, role: userRole };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

// ─── Login ────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<{ ok: true; role: AuthRole } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'invalidCredentials' };

    if (data.token) await saveToken(data.token);
    const user = data.user;
    const userRole = (user?.role || 'job-seeker') as AuthRole;
    const name = user?.displayName || displayNameFromEmail(user?.email || email);

    await saveSession(userRole, user?.email || email, name, user?.id, user?.isPremium);
    return { ok: true, role: userRole };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

// ─── Google Login (expects Firebase ID token from native sign-in) ─

export async function loginWithGoogle(
  idToken: string,
  role: AuthRole,
  locale?: string
): Promise<
  | { ok: true; role: AuthRole; isNew: boolean }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, role, locale }),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'googleAuthFailed' };

    if (data.token) await saveToken(data.token);
    const user = data.user;
    const userRole = (user?.role || role) as AuthRole;
    const name = user?.displayName || displayNameFromEmail(user?.email || '');
    await saveSession(userRole, user?.email || '', name, user?.id, user?.isPremium);

    return { ok: true, role: userRole, isNew: !!data.isNew };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

// ─── Session refresh ───────────────────────────────────────────

/**
 * Refreshes the session against the backend.
 *
 * Returns:
 *   - StoredSession on success (token still valid, optionally rotated)
 *   - 'expired' if the backend rejects the token (401 / authenticated:false) — local
 *     storage is cleared so the next hydrate sees no session
 *   - null on transient errors (network down etc.) — local storage is preserved so
 *     the user can keep working offline
 */
export async function refreshSession(): Promise<StoredSession | 'expired' | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Token rejected by backend (expired, revoked, malformed)
    if (res.status === 401 || res.status === 403) {
      await logout();
      return 'expired';
    }

    const data = await safeJson(res);
    if (!data?.authenticated || !data.user) {
      await logout();
      return 'expired';
    }

    if (data.token) await saveToken(data.token);
    const u = data.user;
    await saveSession(u.role as AuthRole, u.email, u.displayName, u.id, u.isPremium);
    return getSession();
  } catch {
    // Network error — keep the cached session so the app still works
    return null;
  }
}

// ─── Logout ────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await storage.remove(SESSION_KEY);
  await storage.remove(TOKEN_KEY);
}
