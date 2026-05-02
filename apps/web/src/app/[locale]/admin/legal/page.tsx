'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getToken } from '@/lib/auth';
import { saveCmsContent, type CmsItem } from '@/lib/cms';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  Loader2,
  FileText,
  Shield,
  ScrollText,
} from 'lucide-react';
import { clsx } from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const LOCALES = ['de', 'en', 'fr', 'it', 'sq'] as const;
const LOCALE_LABELS: Record<string, string> = { de: 'Deutsch', en: 'English', fr: 'Français', it: 'Italiano', sq: 'Shqip' };

interface LegalSection {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  fieldKey: string;
}

const LEGAL_SECTIONS: LegalSection[] = [
  {
    id: 'Legal',
    label: 'Impressum',
    description: 'Angaben gemäß § 5 TMG',
    icon: FileText,
    fieldKey: 'impressum',
  },
  {
    id: 'Legal',
    label: 'Datenschutzerklärung',
    description: 'Informationen zum Datenschutz',
    icon: Shield,
    fieldKey: 'privacy',
  },
  {
    id: 'Legal',
    label: 'AGB',
    description: 'Allgemeine Geschäftsbedingungen',
    icon: ScrollText,
    fieldKey: 'terms',
  },
];

type FormData = Record<string, Record<string, string>>; // locale -> fieldKey -> value

export default function AdminLegalPage() {
  const t = useTranslations('Admin');
  const currentLocale = useLocale();
  const [activeLocale, setActiveLocale] = useState<string>(currentLocale);
  const [activeTab, setActiveTab] = useState<string>('impressum');
  const [formData, setFormData] = useState<FormData>({});
  const [originalData, setOriginalData] = useState<FormData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadContent = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/cms/content/Legal`);
      if (!res.ok) throw new Error('Failed to load legal content');
      const data = await res.json();
      if (!data.ok) return;

      const fd: FormData = {};
      for (const item of data.content as CmsItem[]) {
        if (!fd[item.locale]) fd[item.locale] = {};
        fd[item.locale][item.fieldKey] = item.value;
      }
      setFormData(fd);
      setOriginalData(JSON.parse(JSON.stringify(fd)));
    } catch (err) {
      console.error('[Legal Editor] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const getValue = (fieldKey: string): string => {
    return formData[activeLocale]?.[fieldKey] || '';
  };

  const setValue = (fieldKey: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (!next[activeLocale]) next[activeLocale] = {};
      next[activeLocale] = { ...next[activeLocale], [fieldKey]: value };
      return next;
    });
  };

  const hasChanges = (): boolean => {
    const current = formData[activeLocale]?.[activeTab] || '';
    const original = originalData[activeLocale]?.[activeTab] || '';
    return current !== original;
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const items = [{
        section: 'Legal',
        fieldKey: activeTab,
        locale: activeLocale,
        value: getValue(activeTab),
        type: 'richText',
      }];

      const result = await saveCmsContent(items, token);
      if (result.ok) {
        setOriginalData((prev) => {
          const next = JSON.parse(JSON.stringify(prev));
          if (!next[activeLocale]) next[activeLocale] = {};
          next[activeLocale][activeTab] = getValue(activeTab);
          return next;
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error('[Legal Editor] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const items = [{
        section: 'Legal',
        fieldKey: activeTab,
        locale: activeLocale,
        value: '',
        type: 'richText',
      }];
      await saveCmsContent(items, token);

      setFormData((prev) => {
        const next = { ...prev };
        if (next[activeLocale]) {
          delete next[activeLocale][activeTab];
        }
        return { ...next };
      });
      setOriginalData((prev) => {
        const next = { ...prev };
        if (next[activeLocale]) {
          delete next[activeLocale][activeTab];
        }
        return { ...next };
      });
    } catch (err) {
      console.error('[Legal Editor] Reset error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#162C66]" />
      </div>
    );
  }

  const changed = hasChanges();

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-[#162C66] mb-2">{t('cmsLegal')}</h1>
        <p className="text-slate-500 font-medium">{t('cmsLegalDesc')}</p>
      </div>

      {/* Language Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 mb-6 inline-flex shadow-sm">
        {LOCALES.map((loc) => (
          <button
            key={loc}
            onClick={() => setActiveLocale(loc)}
            className={clsx(
              'px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
              activeLocale === loc
                ? 'bg-[#162C66] text-white shadow-md'
                : 'text-slate-500 hover:text-[#162C66] hover:bg-slate-50'
            )}
          >
            <span className="mr-1.5">{loc.toUpperCase()}</span>
            <span className="hidden sm:inline text-xs opacity-70">{LOCALE_LABELS[loc]}</span>
          </button>
        ))}
      </div>

      {/* Legal Section Tabs */}
      <div className="flex space-x-3 mb-6">
        {LEGAL_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeTab === section.fieldKey;
          const hasContent = !!(formData[activeLocale]?.[section.fieldKey]);
          return (
            <button
              key={section.fieldKey}
              onClick={() => setActiveTab(section.fieldKey)}
              className={clsx(
                'flex items-center space-x-3 px-5 py-4 rounded-2xl border transition-all font-bold text-sm',
                isActive
                  ? 'bg-white border-[#162C66] text-[#162C66] shadow-lg'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
              )}
            >
              <Icon size={20} />
              <div className="text-left">
                <span className="block">{section.label}</span>
                {hasContent && (
                  <span className="text-xs text-green-500 font-medium mt-0.5 block">Inhalt vorhanden</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#162C66]">
            {LEGAL_SECTIONS.find((s) => s.fieldKey === activeTab)?.label}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {LEGAL_SECTIONS.find((s) => s.fieldKey === activeTab)?.description}
            {' — '}
            <span className="text-[#F5C400] font-medium">{LOCALE_LABELS[activeLocale]}</span>
          </p>
        </div>

        <div className="p-6">
          <p className="text-xs text-slate-400 mb-3 font-medium">
            HTML ist erlaubt. Verwenden Sie &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt; für Struktur.
          </p>
          <textarea
            value={getValue(activeTab)}
            onChange={(e) => setValue(activeTab, e.target.value)}
            placeholder={`${LEGAL_SECTIONS.find((s) => s.fieldKey === activeTab)?.label} Inhalt hier eingeben...`}
            rows={20}
            className="w-full px-5 py-4 border border-slate-200 rounded-xl text-sm font-mono text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none transition-all resize-y leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
          >
            <RotateCcw size={16} />
            <span>{t('cmsResetSection')}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !changed}
            className={clsx(
              'flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
              saved
                ? 'bg-green-500 text-white'
                : changed
                  ? 'bg-[#162C66] text-white hover:bg-[#1f3c8a] shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t('cmsSaving')}</span>
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={16} />
                <span>{t('cmsSaved')}</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{t('cmsSaveSection')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
