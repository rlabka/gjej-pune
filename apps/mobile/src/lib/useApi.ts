import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { getToken } from './auth';

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Small data-fetch hook. Handles auth token, loading + error states,
 * and exposes a stable `refetch` for pull-to-refresh.
 */
export function useApi<T>(path: string | null, authed = false): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchNow = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const token = authed ? (await getToken()) ?? undefined : undefined;
      const result = await api.get<T>(path, token);
      if (mounted.current) setData(result);
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'unknown');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [path, authed]);

  useEffect(() => {
    mounted.current = true;
    fetchNow();
    return () => {
      mounted.current = false;
    };
  }, [fetchNow]);

  return { data, loading, error, refetch: fetchNow };
}

/** Resolve relative upload paths against the API base. */
export function resolveMediaUrl(
  apiUrl: string,
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${apiUrl}${raw.startsWith('/') ? '' : '/'}${raw}`;
}
