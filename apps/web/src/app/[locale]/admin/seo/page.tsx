'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { Loader2, Save, Check, Plus, Trash2, Search as SearchIcon, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';

const LOCALES = ['de', 'en', 'fr', 'it', 'sq'] as const;
type Locale = (typeof LOCALES)[number];

const PAGE_KEYS = [
  'home',
  'jobs',
  'job-seekers',
  'about',
  'contact',
  'pricing',
  'login',
  'register',
  'privacy',
  'imprint',
  'terms',
] as const;

interface SeoEntry {
  id: string;
  pageKey: string;
  locale: string;
  title: string | null;
  description: string | null;
}

export default function AdminSeoPage() {
  const t = useTranslations('Admin.seoPage');
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocale, setActiveLocale] = useState<Locale>('de');
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [customPage, setCustomPage] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Collect all unique page keys from entries + defaults
  const allPageKeys = Array.from(new Set([
    ...PAGE_KEYS,
    ...entries.map(e => e.pageKey),
  ])).sort();

  const fetchEntries = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<{ ok: boolean; pages: SeoEntry[] }>('/api/admin/seo-pages', token);
      if (res.ok) setEntries(res.pages);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const getEntry = (pageKey: string, locale: Locale): { title: string; description: string } => {
    const e = entries.find(x => x.pageKey === pageKey && x.locale === locale);
    return { title: e?.title || '', description: e?.description || '' };
  };

  const handleSave = async (pageKey: string) => {
    const token = getToken();
    if (!token) return;
    const key = `${pageKey}-${activeLocale}`;
    setSaving(key);
    const { title, description } = getEntry(pageKey, activeLocale);
    try {
      const res = await api.put<{ ok: boolean; page: SeoEntry }>('/api/admin/seo-pages', {
        pageKey, locale: activeLocale, title, description,
      }, token);
      if (res.ok) {
        setEntries(prev => {
          const idx = prev.findIndex(x => x.pageKey === pageKey && x.locale === activeLocale);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.page;
            return next;
          }
          return [...prev, res.page];
        });
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {}
    setSaving(null);
  };

  const updateLocal = (pageKey: string, field: 'title' | 'description', value: string) => {
    setEntries(prev => {
      const idx = prev.findIndex(x => x.pageKey === pageKey && x.locale === activeLocale);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: value };
        return next;
      }
      return [...prev, { id: '', pageKey, locale: activeLocale, title: field === 'title' ? value : '', description: field === 'description' ? value : '' }];
    });
  };

  const handleAddCustomPage = () => {
    const key = customPage.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key || allPageKeys.includes(key)) return;
    // Add empty entries so the page appears
    setEntries(prev => [...prev, { id: '', pageKey: key, locale: activeLocale, title: '', description: '' }]);
    setCustomPage('');
  };

  const handleDeletePage = async (pageKey: string) => {
    if (!confirm(t('confirmDelete', { page: pageKey }))) return;
    const token = getToken();
    if (!token) return;
    const toDelete = entries.filter(e => e.pageKey === pageKey && e.id);
    for (const e of toDelete) {
      try { await api.delete(`/api/admin/seo-pages/${e.id}`, token); } catch {}
    }
    setEntries(prev => prev.filter(e => e.pageKey !== pageKey));
  };

  const handleSeed = async () => {
    const token = getToken();
    if (!token) return;
    setSeeding(true);
    try {
      const res = await api.post<{ ok: boolean }>('/api/admin/seo-pages/seed', {}, token);
      if (res.ok) await fetchEntries();
    } catch {}
    setSeeding(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-[#162C66] mb-2">{t('title')}</h1>
          <p className="text-slate-500 font-medium">{t('subtitle')}</p>
        </div>
        {entries.length === 0 && !loading && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
          >
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />}
            {t('importDefaults')}
          </button>
        )}
      </div>

      {/* Locale Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1 w-fit">
        {LOCALES.map(loc => (
          <button
            key={loc}
            onClick={() => setActiveLocale(loc)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-bold transition-all',
              activeLocale === loc
                ? 'bg-[#162C66] text-white'
                : 'text-slate-400 hover:text-[#162C66] hover:bg-slate-50'
            )}
          >
            {loc.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#162C66]" />
        </div>
      ) : (
        <div className="space-y-4">
          {allPageKeys.map(pageKey => {
            const { title, description } = getEntry(pageKey, activeLocale);
            const key = `${pageKey}-${activeLocale}`;
            const isCustom = !PAGE_KEYS.includes(pageKey as any);

            return (
              <div key={pageKey} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SearchIcon size={16} className="text-slate-400" />
                    <h3 className="font-bold text-[#162C66]">/{pageKey}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {saved === key && (
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Check size={12} /> {t('savedSuccess')}</span>
                    )}
                    <button
                      onClick={() => handleSave(pageKey)}
                      disabled={saving === key}
                      className="px-3 py-1.5 bg-[#162C66] text-white rounded-lg text-xs font-bold hover:bg-[#1a3577] disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {saving === key ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      {t('save')}
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => handleDeletePage(pageKey)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('metaTitle')}</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => updateLocal(pageKey, 'title', e.target.value)}
                      placeholder={t('metaTitlePlaceholder')}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">{title.length}/60</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('metaDescription')}</label>
                    <textarea
                      value={description}
                      onChange={e => updateLocal(pageKey, 'description', e.target.value)}
                      placeholder={t('metaDescriptionPlaceholder')}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-[#F5C400] outline-none resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">{description.length}/160</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add custom page */}
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-5 flex items-center gap-3">
            <Plus size={16} className="text-slate-400" />
            <input
              type="text"
              value={customPage}
              onChange={e => setCustomPage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustomPage()}
              placeholder={t('addPagePlaceholder')}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#F5C400] outline-none"
            />
            <button
              onClick={handleAddCustomPage}
              disabled={!customPage.trim()}
              className="px-4 py-2 bg-[#162C66] text-white rounded-lg text-sm font-bold hover:bg-[#1a3577] disabled:opacity-50"
            >
              {t('addPage')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
