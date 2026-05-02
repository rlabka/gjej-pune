'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';

// ─── Types (mirror the shared package types) ────────────

export type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

export interface JobTitle {
  id: string;
  key: string;
  labels: Record<Locale, string>;
}

export interface JobCategory {
  id: string;
  slug: string;
  icon: string;
  labels: Record<Locale, string>;
  titles: JobTitle[];
}

// ─── Module-level cache (shared across all hook instances) ──

let cachedCategories: JobCategory[] | null = null;
let fetchPromise: Promise<JobCategory[]> | null = null;

async function loadCategories(): Promise<JobCategory[]> {
  if (cachedCategories) return cachedCategories;
  if (fetchPromise) return fetchPromise;
  fetchPromise = api
    .get<{ ok: boolean; categories: JobCategory[] }>('/api/categories')
    .then((res) => {
      cachedCategories = res.ok ? res.categories : [];
      fetchPromise = null;
      return cachedCategories;
    })
    .catch(() => {
      fetchPromise = null;
      return [] as JobCategory[];
    });
  return fetchPromise;
}

/** Force re-fetch on next call (e.g. after admin edits categories) */
export function invalidateCategoryCache() {
  cachedCategories = null;
  fetchPromise = null;
}

/** Get cached categories synchronously (for non-component code). Returns [] if not yet loaded. */
export function getCachedCategories(): JobCategory[] {
  return cachedCategories ?? [];
}

/** Ensure categories are loaded, then return them (for non-component async code). */
export async function ensureCategories(): Promise<JobCategory[]> {
  return loadCategories();
}

// ─── Hook ───────────────────────────────────────────────

export function useCategories() {
  const [categories, setCategories] = useState<JobCategory[]>(cachedCategories ?? []);
  const [loading, setLoading] = useState(!cachedCategories);

  useEffect(() => {
    let cancelled = false;
    if (cachedCategories) {
      setCategories(cachedCategories);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadCategories().then((data) => {
      if (!cancelled) {
        setCategories(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { categories, loading };
}

// ─── Standalone helpers (work with any categories array) ─

export function getTranslatedTitle(categories: JobCategory[], key: string, locale: Locale): string {
  for (const cat of categories) {
    const title = cat.titles.find((t) => t.key === key);
    if (title) return title.labels[locale] || title.labels.sq;
  }
  return key;
}

export function getCategoryLabelForTitle(categories: JobCategory[], key: string, locale: Locale): string {
  for (const cat of categories) {
    if (cat.titles.some((t) => t.key === key)) {
      return cat.labels[locale] || cat.labels.sq;
    }
  }
  return '';
}

export function getCategoryForTitle(categories: JobCategory[], key: string): JobCategory | undefined {
  return categories.find((cat) => cat.titles.some((t) => t.key === key));
}

// ─── Convenience hook that also provides bound helpers ──

export function useCategoryHelpers() {
  const { categories, loading } = useCategories();

  const helpers = useMemo(() => ({
    translateTitle: (key: string, locale: Locale) => getTranslatedTitle(categories, key, locale),
    categoryLabel: (key: string, locale: Locale) => getCategoryLabelForTitle(categories, key, locale),
    categoryFor: (key: string) => getCategoryForTitle(categories, key),
  }), [categories]);

  return { categories, loading, ...helpers };
}
