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
  login as apiLogin,
  logout as apiLogout,
  refreshSession,
  register as apiRegister,
  type AuthRole,
  type StoredSession,
} from '@/lib/auth';

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
    } else {
      setSession(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.ok) {
      const s = await getSession();
      setSession(s);
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
    () => ({ session, isLoading, login, register, logout, refresh }),
    [session, isLoading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
