/**
 * Auth client – calls the Express backend API.
 *
 * JWT token + session are cached in localStorage so existing
 * components (Header, Guards, TopNavs) continue to work unchanged.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

// ─── Safe response helpers ───────────────────────────────────

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Response was not JSON (e.g. Cloudflare challenge page, HTML error)
    console.error('[Auth] Non-JSON response:', res.status, text.slice(0, 300));
    return null;
  }
}

function classifyError(err: unknown): string {
  if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch'))) {
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

function canUseStorage() {
  if (typeof window === 'undefined') return false;
  try {
    const key = '__storage_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
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

/** Single source of truth for display name; use in Header and JobSeekerTopNav */
export function getDisplayName(session: StoredSession): string {
  if (session.displayName) return session.displayName;
  if (session.role === 'job-seeker') return displayNameFromEmail(session.email);
  return displayNameFromEmail(session.email) ?? 'Account';
}

// ─── Token ──────────────────────────────────────────────────────

export function getToken(): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.warn('[Auth] Cannot save token — storage blocked');
  }
}

// ─── Read session (client-side cache) ───────────────────────────

export function getSession(): StoredSession | null {
  if (!canUseStorage()) return null;
  try {
    const session = safeParse<StoredSession>(window.localStorage.getItem(SESSION_KEY));
    if (!session?.isAuthenticated || !session.role || !session.email) return null;
    return session;
  } catch {
    return null;
  }
}

function saveSession(role: AuthRole, email: string, displayName?: string, userId?: string, isPremium?: boolean) {
  if (!canUseStorage()) return;
  try {
    const session: StoredSession = { isAuthenticated: true, role, email, displayName, userId, isPremium: isPremium ?? false };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    console.warn('[Auth] Cannot save session — storage blocked');
  }
}

// ─── Register (POST /api/auth/register) ─────────────────────────

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

    if (!res.ok) {
      return { ok: false, error: data.error || 'registrationFailed' };
    }

    // Save token + session from register response
    if (data.token) saveToken(data.token);
    const user = data.user;
    const userRole = (user?.role || role) as AuthRole;
    const name = user?.displayName || displayName || displayNameFromEmail(email);
    saveSession(userRole, user?.email || email.toLowerCase().trim(), name, user?.id, user?.isPremium);

    return { ok: true, role: userRole };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

// ─── Login (POST /api/auth/login) ───────────────────────────────

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

    if (!res.ok) {
      return { ok: false, error: data.error || 'invalidCredentials' };
    }

    if (data.token) saveToken(data.token);
    const user = data.user;
    const userRole = (user?.role || 'job-seeker') as AuthRole;
    const name = user?.displayName || displayNameFromEmail(user?.email || email);

    saveSession(userRole, user?.email || email, name, user?.id, user?.isPremium);
    return { ok: true, role: userRole };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

// ─── Google Login (Firebase) ────────────────────────────────────

export async function loginWithGoogle(
  idToken: string,
  role: AuthRole,
  locale?: string
): Promise<{ ok: true; role: AuthRole; isNew: boolean } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, role, locale }),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };

    if (!res.ok) {
      return { ok: false, error: data.error || 'googleAuthFailed' };
    }

    if (data.token) saveToken(data.token);
    const user = data.user;
    const userRole = (user?.role || role) as AuthRole;
    const name = user?.displayName || displayNameFromEmail(user?.email || '');
    saveSession(userRole, user?.email || '', name, user?.id, user?.isPremium);

    return { ok: true, role: userRole, isNew: !!data.isNew };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

// ─── Update Role ────────────────────────────────────────────────

export async function updateRole(
  newRole: AuthRole
): Promise<{ ok: true; role: AuthRole } | { ok: false; error: string }> {
  try {
    const token = getToken();
    if (!token) return { ok: false, error: 'unauthorized' };

    const res = await fetch(`${API_URL}/api/auth/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'updateFailed' };

    if (data.token) saveToken(data.token);
    const user = data.user;
    const userRole = (user?.role || newRole) as AuthRole;
    const session = getSession();
    saveSession(userRole, user?.email || session?.email || '', user?.displayName || session?.displayName || '', user?.id || session?.userId, user?.isPremium ?? session?.isPremium);

    return { ok: true, role: userRole };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

// ─── Clear session only (keep token for pending API calls) ───

export function clearSession() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

// ─── Premium ─────────────────────────────────────────────────────

export function getIsPremium(): boolean {
  const session = getSession();
  return session?.isPremium ?? false;
}

export async function refreshSession(): Promise<boolean> {
  try {
    const token = getToken();
    if (!token) return false;
    const res = await fetch(`${API_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await safeJson(res);
    if (!data?.authenticated || !data.user) return false;
    if (data.token) saveToken(data.token);
    const u = data.user;
    saveSession(u.role as AuthRole, u.email, u.displayName, u.id, u.isPremium);
    return true;
  } catch {
    return false;
  }
}

export async function activatePremium(): Promise<{ ok: true; isPremium: boolean } | { ok: false; error: string }> {
  try {
    const token = getToken();
    if (!token) return { ok: false, error: 'unauthorized' };

    const res = await fetch(`${API_URL}/api/auth/toggle-premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'toggleFailed' };

    if (data.token) saveToken(data.token);
    const user = data.user;
    const session = getSession();
    saveSession(
      (user?.role || session?.role || 'job-seeker') as AuthRole,
      user?.email || session?.email || '',
      user?.displayName || session?.displayName || '',
      user?.id || session?.userId,
      user?.isPremium
    );

    return { ok: true, isPremium: user?.isPremium ?? false };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

// ─── Logout ─────────────────────────────────────────────────────

export async function logout() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem('mockAuth.session');
    window.localStorage.removeItem('mockAuth.user');
  } catch {
    // ignore
  }
}
