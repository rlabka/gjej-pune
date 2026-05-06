import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getSession,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
  register as apiRegister,
  type AuthRole,
  type StoredSession,
} from '@/lib/auth';
import { api } from '@/lib/api';
import { i18n } from '@/i18n';

/**
 * Push the mobile-side locale to the backend so that server-issued
 * notifications (push, email) come in the user's chosen language.
 * Without this sync, the DB locale stays at whatever was set during
 * registration (typically the build-time default), so a user who later
 * switches the app to German still gets Albanian pushes.
 */
async function syncLocaleToBackend() {
  try {
    const token = await getToken();
    if (!token) return;
    const locale = i18n.locale;
    if (!locale) return;
    await api.patch('/api/auth/locale', { locale }, token);
  } catch {
    /* non-fatal */
  }
}

type AuthState = {
  session: StoredSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    role: AuthRole,
    displayName?: string,
    locale?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const cached = await getSession();
    if (cached) {
      setSession(cached);
      // Fire-and-forget refresh against the backend
      refreshSession().then((refreshed) => {
        if (refreshed === 'expired') {
          // Token rejected — drop cached session so user is sent back to welcome/login
          setSession(null);
        } else if (refreshed) {
          setSession(refreshed);
        }
        // null (network error) → keep cached session
      });
      // Push the current mobile locale to the backend on every app start.
      // This recovers users whose DB locale is stale from before this fix
      // shipped (e.g. registered in 'sq' default but switched UI to 'de').
      void syncLocaleToBackend();
    } else {
      setSession(null);
    }
    setIsLoading(false);
  }, []);

  /**
   * Force a session reload. Used by external auth flows (Google/Apple) after
   * they save the session to storage themselves. Reads from storage FIRST so
   * the React state updates immediately even if the backend session validation
   * has a network blip — otherwise a fresh sign-in races with the (tabs)
   * layout's auth check and bounces the user back to welcome.
   */
  const reload = useCallback(async () => {
    const cached = await getSession();
    setSession(cached);
    if (cached) void syncLocaleToBackend();
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.ok) {
      const s = await getSession();
      setSession(s);
      void syncLocaleToBackend();
    }
    return result.ok
      ? { ok: true }
      : { ok: false, error: (result as { error: string }).error };
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      role: AuthRole,
      displayName?: string,
      locale?: string
    ) => {
      const result = await apiRegister(email, password, role, displayName, locale);
      if (result.ok) {
        const s = await getSession();
        setSession(s);
      }
      return result.ok
        ? { ok: true }
        : { ok: false, error: (result as { error: string }).error };
    },
    []
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setSession(null);
  }, []);

  const refresh = useCallback(async () => {
    const refreshed = await refreshSession();
    if (refreshed === 'expired') setSession(null);
    else if (refreshed) setSession(refreshed);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, isLoading, login, register, logout, refresh, reload }),
    [session, isLoading, login, register, logout, refresh, reload]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
