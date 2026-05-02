'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { getToken, getSession } from '@/lib/auth';

type TargetType = 'job' | 'ad';

const PENDING_KEY = 'favorite.pending';

function setPending(targetType: TargetType, targetId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PENDING_KEY, JSON.stringify({ targetType, targetId }));
}

function getPending(): { targetType: TargetType; targetId: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw);
  } catch { return null; }
}

function getLocale(): string {
  if (typeof window === 'undefined') return 'de';
  return window.location.pathname.split('/')[1] || 'de';
}

export function useFavorites() {
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [adIds, setAdIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const pendingProcessed = useRef(false);

  const loadFavorites = useCallback(() => {
    const token = getToken();
    if (!token) {
      setLoaded(true);
      return;
    }
    api.get<{ ok: boolean; jobIds: string[]; adIds: string[] }>('/api/favorites/ids', token)
      .then((res) => {
        if (res.ok) {
          setJobIds(res.jobIds);
          setAdIds(res.adIds);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // On mount: load favorites, then process any pending favorite from pre-login redirect
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoaded(true);
      return;
    }
    api.get<{ ok: boolean; jobIds: string[]; adIds: string[] }>('/api/favorites/ids', token)
      .then(async (res) => {
        if (res.ok) {
          setJobIds(res.jobIds);
          setAdIds(res.adIds);
        }
        // Process pending favorite after loading current favorites
        if (!pendingProcessed.current) {
          pendingProcessed.current = true;
          const pending = getPending();
          if (pending) {
            const alreadySaved = pending.targetType === 'job'
              ? res.ok && res.jobIds.includes(pending.targetId)
              : res.ok && res.adIds.includes(pending.targetId);
            if (!alreadySaved) {
              // Optimistic UI
              if (pending.targetType === 'job') {
                setJobIds((prev) => [...prev, pending.targetId]);
              } else {
                setAdIds((prev) => [...prev, pending.targetId]);
              }
              // Save to backend
              await api.post('/api/favorites/toggle', pending, token).catch(() => {});
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const isFavorited = useCallback((targetType: TargetType, targetId: string) => {
    return targetType === 'job' ? jobIds.includes(targetId) : adIds.includes(targetId);
  }, [jobIds, adIds]);

  const toggleFavorite = useCallback(async (targetType: TargetType, targetId: string) => {
    const token = getToken();

    // Not logged in → save pending + redirect to login
    if (!token) {
      setPending(targetType, targetId);
      const locale = getLocale();
      const returnUrl = window.location.pathname + window.location.search;
      window.location.href = `/${locale}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      return false;
    }

    // Optimistic update
    const removing = targetType === 'job' ? jobIds.includes(targetId) : adIds.includes(targetId);
    if (targetType === 'job') {
      setJobIds((prev) => removing ? prev.filter((id) => id !== targetId) : [...prev, targetId]);
    } else {
      setAdIds((prev) => removing ? prev.filter((id) => id !== targetId) : [...prev, targetId]);
    }

    try {
      const res = await api.post<{ ok: boolean; favorited: boolean }>('/api/favorites/toggle', { targetType, targetId }, token);
      if (!res.ok) { loadFavorites(); return false; }
      return res.favorited;
    } catch {
      loadFavorites();
      return false;
    }
  }, [jobIds, adIds, loadFavorites]);

  const trackShare = useCallback(async (targetType: TargetType, targetId: string) => {
    const token = getToken();
    if (!token) return;
    api.post('/api/favorites/share', { targetType, targetId }, token).catch(() => {});
  }, []);

  return { jobIds, adIds, loaded, isFavorited, toggleFavorite, trackShare };
}
