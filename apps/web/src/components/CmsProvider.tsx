'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useLocale } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const CMS_UPDATED_EVENT = 'cms:updated';

interface CmsContextType {
  overrides: Record<string, Record<string, string>>;
  loading: boolean;
  refresh: () => void;
}

const CmsContext = createContext<CmsContextType>({
  overrides: {},
  loading: true,
  refresh: () => {},
});

export function useCms() {
  return useContext(CmsContext);
}

/**
 * Fetches CMS overrides and provides them via context.
 * The layout merges these overrides into the i18n messages.
 */
export default function CmsProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);

  const loadOverrides = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/content?locale=${locale}`);
      if (!res.ok) throw new Error('CMS fetch failed');
      const data = await res.json();
      if (data.ok && data.grouped) {
        setOverrides(data.grouped);
      }
    } catch (err) {
      console.warn('[CmsProvider] Failed to load overrides:', err);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadOverrides();
  }, [loadOverrides]);

  useEffect(() => {
    const handler = () => loadOverrides();
    window.addEventListener(CMS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CMS_UPDATED_EVENT, handler);
  }, [loadOverrides]);

  const refresh = useCallback(() => {
    loadOverrides();
  }, [loadOverrides]);

  return (
    <CmsContext.Provider value={{ overrides, loading, refresh }}>
      {children}
    </CmsContext.Provider>
  );
}
