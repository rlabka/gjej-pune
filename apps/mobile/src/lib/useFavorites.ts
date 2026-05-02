import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from './api';
import { getToken } from './auth';

type FavoritesResponse = {
  ok: boolean;
  jobIds: string[];
  adIds: string[];
};

type FavType = 'job' | 'ad';

let cachedJobIds = new Set<string>();
let cachedAdIds = new Set<string>();
let cachedToken: string | null = null;
let inFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function notifyAll() {
  for (const fn of subscribers) fn();
}

async function loadFavorites(force = false): Promise<void> {
  const token = (await getToken()) ?? null;
  if (!token) {
    cachedJobIds = new Set();
    cachedAdIds = new Set();
    cachedToken = null;
    notifyAll();
    return;
  }
  if (!force && cachedToken === token && (cachedJobIds.size > 0 || cachedAdIds.size > 0)) {
    return;
  }
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await api.get<FavoritesResponse>('/api/favorites/ids', token);
      if (res?.ok) {
        cachedJobIds = new Set(res.jobIds ?? []);
        cachedAdIds = new Set(res.adIds ?? []);
        cachedToken = token;
        notifyAll();
      }
    } catch {
      /* ignore */
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export function useFavorites() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const sub = () => forceUpdate((n) => n + 1);
    subscribers.add(sub);
    loadFavorites();
    return () => {
      subscribers.delete(sub);
    };
  }, []);

  // Re-fetch when screen regains focus (so favorites stay in sync)
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const isFavorited = useCallback((type: FavType, id: string) => {
    return type === 'job' ? cachedJobIds.has(id) : cachedAdIds.has(id);
  }, []);

  const toggleFavorite = useCallback(
    async (type: FavType, id: string): Promise<{ ok: boolean; favorited: boolean }> => {
      const token = (await getToken()) ?? undefined;
      if (!token) return { ok: false, favorited: false };
      // Optimistic update
      const set = type === 'job' ? cachedJobIds : cachedAdIds;
      const wasFavorited = set.has(id);
      if (wasFavorited) set.delete(id);
      else set.add(id);
      notifyAll();
      try {
        const res = await api.post<{ ok: boolean; favorited: boolean }>(
          '/api/favorites/toggle',
          { targetType: type, targetId: id },
          token
        );
        if (res?.ok) {
          // Authoritative sync with server result
          if (res.favorited) set.add(id);
          else set.delete(id);
          notifyAll();
          return { ok: true, favorited: !!res.favorited };
        }
      } catch {
        // Roll back on failure
        if (wasFavorited) set.add(id);
        else set.delete(id);
        notifyAll();
      }
      return { ok: false, favorited: wasFavorited };
    },
    []
  );

  return { isFavorited, toggleFavorite, refresh: () => loadFavorites(true) };
}
