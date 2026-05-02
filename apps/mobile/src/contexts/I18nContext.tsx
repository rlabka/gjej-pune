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
  i18n,
  initI18n,
  setLocale as persistLocale,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/i18n';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

type I18nState = {
  locale: Locale;
  ready: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, opts?: Record<string, unknown>) => string;
  locales: readonly Locale[];
};

const I18nContext = createContext<I18nState | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(i18n.locale as Locale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then((resolved) => {
      setLocaleState(resolved);
      setReady(true);
    });
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    await persistLocale(next);
    setLocaleState(next);
    // Sync to backend so server-side notifications (push, email) use the
    // user's chosen language. Fire-and-forget — UI must not block on network.
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        await api.patch('/api/auth/locale', { locale: next }, token);
      } catch {
        /* network or auth issue — local locale still applies */
      }
    })();
  }, []);

  const t = useCallback(
    (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts),
    // locale in deps so memoized components re-render on change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  const value = useMemo<I18nState>(
    () => ({ locale, ready, setLocale, t, locales: SUPPORTED_LOCALES }),
    [locale, ready, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
