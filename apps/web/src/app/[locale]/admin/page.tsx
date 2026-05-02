'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { getToken } from '@/lib/auth';
import { saveCmsContent, uploadCmsImage, type CmsItem } from '@/lib/cms';
import {
  ChevronDown,
  Save,
  RotateCcw,
  Upload,
  CheckCircle2,
  Loader2,
  Globe,
  Image as ImageIcon,
  Type,
  X,
  Trash2,
  Plus,
  Megaphone,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from '@/i18n/routing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const LOCALES = ['de', 'en', 'fr', 'it', 'sq'] as const;
const LOCALE_LABELS: Record<string, string> = { de: 'Deutsch', en: 'English', fr: 'Français', it: 'Italiano', sq: 'Shqip' };

// ─── Section Definitions ──────────────────────────────────────────
interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image';
  placeholder?: string;
}

interface SectionDef {
  id: string;
  label: string;
  description: string;
  fields: FieldDef[];
  dynamic?: boolean;
}

const SECTIONS: SectionDef[] = [
  {
    id: 'Hero',
    label: 'Hero Section',
    description: 'Hauptbereich oben auf der Landing Page',
    fields: [
      { key: 'title', label: 'Titel', type: 'text', placeholder: 'z.B. Finde Jobs in Europa' },
      { key: 'subtitle', label: 'Untertitel', type: 'textarea', placeholder: 'Beschreibung unter dem Titel' },
      { key: 'lookingForJob', label: 'Button: Job suchen', type: 'text' },
      { key: 'lookingForEmployees', label: 'Button: Mitarbeiter suchen', type: 'text' },
      { key: 'cityPlaceholder', label: 'Stadt-Placeholder', type: 'text' },
      { key: 'searchNow', label: 'Suche-Button Text', type: 'text' },
      { key: 'trustBadge', label: 'Trust Badge Text', type: 'text' },
      { key: 'trustBadgeDesc', label: 'Trust Badge Beschreibung', type: 'text' },
      { key: 'heroImage', label: 'Hero Bild', type: 'image' },
    ],
  },
  {
    id: 'Trust',
    label: 'Trust Logos',
    description: 'Partner-Logos Bereich',
    fields: [
      { key: 'title', label: 'Titel', type: 'text' },
    ],
    dynamic: true,
  },
  {
    id: 'HowItWorks',
    label: 'So funktioniert\'s',
    description: '3 Schritte Erklärung',
    fields: [
      { key: 'title', label: 'Abschnitts-Titel', type: 'text' },
      { key: 'step1Title', label: 'Schritt 1: Titel', type: 'text' },
      { key: 'step1Desc', label: 'Schritt 1: Beschreibung', type: 'textarea' },
      { key: 'step1Link', label: 'Schritt 1: Link-Text', type: 'text' },
      { key: 'step2Title', label: 'Schritt 2: Titel', type: 'text' },
      { key: 'step2Desc', label: 'Schritt 2: Beschreibung', type: 'textarea' },
      { key: 'step2Link', label: 'Schritt 2: Link-Text', type: 'text' },
      { key: 'step3Title', label: 'Schritt 3: Titel', type: 'text' },
      { key: 'step3Desc', label: 'Schritt 3: Beschreibung', type: 'textarea' },
      { key: 'step3Link', label: 'Schritt 3: Link-Text', type: 'text' },
    ],
  },
  {
    id: 'PlatformOffer',
    label: 'Plattform Angebot',
    description: 'Bullets und CTA',
    fields: [
      { key: 'title', label: 'Titel', type: 'text' },
      { key: 'bullet1_bold', label: 'Bullet 1: Fett', type: 'text' },
      { key: 'bullet1_normal', label: 'Bullet 1: Normal', type: 'text' },
      { key: 'bullet2_bold', label: 'Bullet 2: Fett', type: 'text' },
      { key: 'bullet2_normal', label: 'Bullet 2: Normal', type: 'text' },
      { key: 'bullet3_bold', label: 'Bullet 3: Fett', type: 'text' },
      { key: 'bullet3_normal', label: 'Bullet 3: Normal', type: 'text' },
      { key: 'bullet4_bold', label: 'Bullet 4: Fett', type: 'text' },
      { key: 'bullet4_normal', label: 'Bullet 4: Normal', type: 'text' },
      { key: 'cta', label: 'CTA Button Text', type: 'text' },
    ],
  },
  {
    id: 'CitySearch',
    label: 'Stadt-Suche',
    description: 'Städte/Länder und Suchbereich',
    fields: [
      { key: 'title', label: 'Titel', type: 'text' },
      { key: 'searchTitle', label: 'Such-Titel', type: 'text' },
      { key: 'searchDesc', label: 'Such-Beschreibung', type: 'textarea' },
      { key: 'postcodePlaceholder', label: 'PLZ Placeholder', type: 'text' },
      { key: 'searchButton', label: 'Such-Button Text', type: 'text' },
      { key: 'imageOverlayText', label: 'Bild-Overlay Text', type: 'text' },
      { key: 'country1', label: 'Land/Stadt 1', type: 'text' },
      { key: 'country2', label: 'Land/Stadt 2', type: 'text' },
      { key: 'country3', label: 'Land/Stadt 3', type: 'text' },
      { key: 'country4', label: 'Land/Stadt 4', type: 'text' },
      { key: 'country5', label: 'Land/Stadt 5', type: 'text' },
      { key: 'country6', label: 'Land/Stadt 6', type: 'text' },
      { key: 'country7', label: 'Land/Stadt 7', type: 'text' },
      { key: 'country8', label: 'Land/Stadt 8', type: 'text' },
      { key: 'sectionImage', label: 'Bereichs-Bild', type: 'image' },
    ],
  },
  {
    id: 'Testimonials',
    label: 'Testimonials',
    description: 'Kundenbewertungen',
    fields: [
      { key: 'title', label: 'Abschnitts-Titel', type: 'text' },
      { key: 'review1_name', label: 'Review 1: Name', type: 'text' },
      { key: 'review1_city', label: 'Review 1: Stadt', type: 'text' },
      { key: 'review1_text', label: 'Review 1: Text', type: 'textarea' },
      { key: 'review1_img', label: 'Review 1: Avatar', type: 'image' },
      { key: 'review2_name', label: 'Review 2: Name', type: 'text' },
      { key: 'review2_city', label: 'Review 2: Stadt', type: 'text' },
      { key: 'review2_text', label: 'Review 2: Text', type: 'textarea' },
      { key: 'review2_img', label: 'Review 2: Avatar', type: 'image' },
      { key: 'review3_name', label: 'Review 3: Name', type: 'text' },
      { key: 'review3_city', label: 'Review 3: Stadt', type: 'text' },
      { key: 'review3_text', label: 'Review 3: Text', type: 'textarea' },
      { key: 'review3_img', label: 'Review 3: Avatar', type: 'image' },
    ],
  },
  {
    id: 'FAQ',
    label: 'FAQ',
    description: 'Häufig gestellte Fragen',
    fields: [
      { key: 'title', label: 'Abschnitts-Titel', type: 'text' },
    ],
    dynamic: true,
  },
  {
    id: 'CTASection',
    label: 'CTA Banner',
    description: 'Call-to-Action Bereich',
    fields: [
      { key: 'title', label: 'Titel', type: 'text' },
      { key: 'cta', label: 'Button Text', type: 'text' },
    ],
  },
  {
    id: 'WhyUs',
    label: 'Warum wir?',
    description: 'Vorteile der Plattform',
    fields: [
      { key: 'title', label: 'Titel', type: 'text' },
      { key: 'titleHighlight', label: 'Titel Highlight', type: 'text' },
      { key: 'description', label: 'Beschreibung', type: 'textarea' },
      { key: 'description2', label: 'Beschreibung 2', type: 'textarea' },
      { key: 'feature1', label: 'Feature 1', type: 'text' },
      { key: 'feature2', label: 'Feature 2', type: 'text' },
      { key: 'feature3', label: 'Feature 3', type: 'text' },
      { key: 'feature4', label: 'Feature 4', type: 'text' },
      { key: 'cta', label: 'CTA Button Text', type: 'text' },
    ],
  },
  {
    id: 'WhatAreYouLookingFor',
    label: 'Was suchst du?',
    description: 'Auswahl-Karten',
    fields: [
      { key: 'title', label: 'Titel', type: 'text' },
      { key: 'titleHighlight', label: 'Titel Highlight', type: 'text' },
      { key: 'titleEnd', label: 'Titel Ende', type: 'text' },
      { key: 'option1', label: 'Option 1', type: 'text' },
      { key: 'option2', label: 'Option 2', type: 'text' },
    ],
  },
  {
    id: 'AdditionalServices',
    label: 'Weitere Dienstleistungen',
    description: 'Service-Karten',
    fields: [
      { key: 'title', label: 'Titel', type: 'text' },
      { key: 'description', label: 'Beschreibung', type: 'textarea' },
      { key: 'jobs', label: 'Jobs Titel', type: 'text' },
      { key: 'jobsDesc', label: 'Jobs Beschreibung', type: 'textarea' },
      { key: 'freelance', label: 'Freelance Titel', type: 'text' },
      { key: 'freelanceDesc', label: 'Freelance Beschreibung', type: 'textarea' },
      { key: 'companies', label: 'Firmen Titel', type: 'text' },
      { key: 'companiesDesc', label: 'Firmen Beschreibung', type: 'textarea' },
      { key: 'recruiting', label: 'Recruiting Titel', type: 'text' },
      { key: 'recruitingDesc', label: 'Recruiting Beschreibung', type: 'textarea' },
      { key: 'moreInfo', label: 'Mehr Info Text', type: 'text' },
      { key: 'jobsImage', label: 'Jobs Bild', type: 'image' },
      { key: 'freelanceImage', label: 'Freelance Bild', type: 'image' },
      { key: 'companiesImage', label: 'Firmen Bild', type: 'image' },
      { key: 'recruitingImage', label: 'Recruiting Bild', type: 'image' },
    ],
  },
  {
    id: 'Footer',
    label: 'Footer',
    description: 'Fußzeile der Seite',
    fields: [
      { key: 'description', label: 'Beschreibung', type: 'textarea' },
      { key: 'platform', label: 'Spalte: Plattform', type: 'text' },
      { key: 'jobs', label: 'Link: Jobs', type: 'text' },
      { key: 'companies', label: 'Link: Firmen', type: 'text' },
      { key: 'howItWorks', label: 'Link: So funktioniert\'s', type: 'text' },
      { key: 'company', label: 'Spalte: Unternehmen', type: 'text' },
      { key: 'about', label: 'Link: Über uns', type: 'text' },
      { key: 'contact', label: 'Link: Kontakt', type: 'text' },
      { key: 'privacy', label: 'Link: Datenschutz', type: 'text' },
      { key: 'agb', label: 'Link: AGB', type: 'text' },
      { key: 'impression', label: 'Link: Impressum', type: 'text' },
      { key: 'selectLanguage', label: 'Sprachauswahl Titel', type: 'text' },
      { key: 'copyright', label: 'Copyright Text', type: 'text' },
    ],
  },
];

// ─── Types ────────────────────────────────────────────────────────
type FormData = Record<string, Record<string, Record<string, string>>>; // section -> locale -> fieldKey -> value
type MessagesMap = Record<string, Record<string, any>>; // locale -> section -> key -> value

// Load i18n message files for all locales
async function loadAllMessages(): Promise<MessagesMap> {
  const [de, en, fr, it, sq] = await Promise.all([
    import('@/messages/de.json').then((m) => m.default),
    import('@/messages/en.json').then((m) => m.default),
    import('@/messages/fr.json').then((m) => m.default),
    import('@/messages/it.json').then((m) => m.default),
    import('@/messages/sq.json').then((m) => m.default),
  ]);
  return { de, en, fr, it, sq };
}

export default function AdminLandingPageEditor() {
  const t = useTranslations('Admin');
  const currentLocale = useLocale();
  const [activeLocale, setActiveLocale] = useState<string>(currentLocale);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ Hero: true });
  const [formData, setFormData] = useState<FormData>({});
  const [originalData, setOriginalData] = useState<FormData>({});
  const [defaults, setDefaults] = useState<MessagesMap>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAds, setActiveAds] = useState<{ id: string; companyName: string; companyWebsite: string | null; logoUrl: string | null; expiresAt: string | null }[]>([]);

  // Load active ad placements
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/api/admin/ad-placements?status=active`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.ok && data.ads) setActiveAds(data.ads); })
      .catch(() => {});
  }, []);

  // Load i18n defaults + CMS overrides, merge them
  const loadContent = useCallback(async () => {
    try {
      // 1) Load all i18n message files
      const msgs = await loadAllMessages();
      setDefaults(msgs);

      // 2) Build defaults-based formData
      const fd: FormData = {};
      for (const section of SECTIONS) {
        fd[section.id] = {};
        for (const loc of LOCALES) {
          fd[section.id][loc] = {};
          const sectionMsgs = msgs[loc]?.[section.id];
          if (sectionMsgs && typeof sectionMsgs === 'object') {
            for (const field of section.fields) {
              const val = sectionMsgs[field.key];
              if (typeof val === 'string') {
                fd[section.id][loc][field.key] = val;
              }
            }
            // For dynamic sections (FAQ), also load q1..qN / a1..aN keys
            if (section.dynamic) {
              for (const [k, v] of Object.entries(sectionMsgs)) {
                if (typeof v === 'string' && /^(q|a|logo)\d+$/.test(k)) {
                  fd[section.id][loc][k] = v;
                }
              }
            }
          }
        }
      }

      // 3) Load CMS overrides and merge on top
      const res = await fetch(`${API_URL}/api/cms/content`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          for (const item of data.content as CmsItem[]) {
            if (!fd[item.section]) fd[item.section] = {};
            if (!fd[item.section][item.locale]) fd[item.section][item.locale] = {};
            fd[item.section][item.locale][item.fieldKey] = item.value;
          }
        }
      }

      setFormData(fd);
      setOriginalData(JSON.parse(JSON.stringify(fd)));
    } catch (err) {
      console.error('[CMS Editor] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Get the default i18n value for a field
  const getDefault = (section: string, fieldKey: string): string => {
    const val = defaults[activeLocale]?.[section]?.[fieldKey];
    return typeof val === 'string' ? val : '';
  };

  const getValue = (section: string, fieldKey: string): string => {
    return formData[section]?.[activeLocale]?.[fieldKey] || '';
  };

  const setValue = (section: string, fieldKey: string, value: string, allLocales = false) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (!next[section]) next[section] = {};
      const locales = allLocales ? LOCALES : [activeLocale];
      for (const loc of locales) {
        if (!next[section][loc]) next[section][loc] = {};
        next[section][loc] = { ...next[section][loc], [fieldKey]: value };
      }
      return next;
    });
  };

  const hasChanges = (sectionId: string): boolean => {
    const current = formData[sectionId]?.[activeLocale] || {};
    const original = originalData[sectionId]?.[activeLocale] || {};
    const allKeys = new Set([...Object.keys(current), ...Object.keys(original)]);
    for (const key of allKeys) {
      if ((current[key] || '') !== (original[key] || '')) return true;
    }
    return false;
  };

  const handleSave = async (sectionId: string) => {
    const token = getToken();
    if (!token) return;

    setSaving(sectionId);
    try {
      const sectionData = formData[sectionId]?.[activeLocale] || {};
      const sectionDef = SECTIONS.find((s) => s.id === sectionId);
      if (!sectionDef) return;

      const items: { section: string; fieldKey: string; locale: string; value: string; type: string }[] = [];

      if (sectionDef.dynamic) {
        // For dynamic sections (Trust logos, FAQ), save keys across all locales for image-like fields
        for (const loc of LOCALES) {
          const locData = formData[sectionId]?.[loc] || {};
          for (const [key, value] of Object.entries(locData)) {
            items.push({ section: sectionId, fieldKey: key, locale: loc, value: value || '', type: key.startsWith('logo') ? 'image' : 'text' });
          }
        }
      } else {
        // For static sections: save text fields for active locale, image fields for ALL locales
        for (const field of sectionDef.fields) {
          if (field.type === 'image') {
            for (const loc of LOCALES) {
              const val = formData[sectionId]?.[loc]?.[field.key] || sectionData[field.key] || '';
              items.push({ section: sectionId, fieldKey: field.key, locale: loc, value: val, type: 'image' });
            }
          } else {
            items.push({ section: sectionId, fieldKey: field.key, locale: activeLocale, value: sectionData[field.key] || '', type: 'text' });
          }
        }
      }

      const result = await saveCmsContent(items, token);
      if (result.ok) {
        setOriginalData((prev) => {
          const next = JSON.parse(JSON.stringify(prev));
          if (!next[sectionId]) next[sectionId] = {};
          // Update originalData for all locales that were saved
          for (const loc of LOCALES) {
            if (formData[sectionId]?.[loc]) {
              if (!next[sectionId][loc]) next[sectionId][loc] = {};
              next[sectionId][loc] = { ...formData[sectionId][loc] };
            }
          }
          return next;
        });
        setSaved(sectionId);
        setTimeout(() => setSaved(null), 2500);
      }
    } catch (err) {
      console.error('[CMS Editor] Save error:', err);
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (sectionId: string) => {
    const token = getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/cms/content/${sectionId}?locale=${activeLocale}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reset to i18n defaults
      const sectionDef = SECTIONS.find((s) => s.id === sectionId);
      const defaultValues: Record<string, string> = {};
      if (sectionDef) {
        for (const field of sectionDef.fields) {
          const val = defaults[activeLocale]?.[sectionId]?.[field.key];
          if (typeof val === 'string') defaultValues[field.key] = val;
        }
      }

      setFormData((prev) => {
        const next = { ...prev };
        if (!next[sectionId]) next[sectionId] = {};
        next[sectionId][activeLocale] = { ...defaultValues };
        return { ...next };
      });
      setOriginalData((prev) => {
        const next = { ...prev };
        if (!next[sectionId]) next[sectionId] = {};
        next[sectionId][activeLocale] = { ...defaultValues };
        return { ...next };
      });
    } catch (err) {
      console.error('[CMS Editor] Reset error:', err);
    }
  };

  const handleImageUpload = async (sectionId: string, fieldKey: string, file: File) => {
    const token = getToken();
    if (!token) return;

    const result = await uploadCmsImage(file, token);
    if (result.ok && result.url) {
      setValue(sectionId, fieldKey, result.url, true);
    }
  };

  // ─── FAQ Dynamic Helpers ─────────────────────────────────────────
  const getFaqCount = (): number => {
    const data = formData['FAQ']?.[activeLocale] || {};
    let max = 0;
    for (const key of Object.keys(data)) {
      const match = key.match(/^q(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    }
    return max;
  };

  const addFaqItem = () => {
    const next = getFaqCount() + 1;
    setValue('FAQ', `q${next}`, '');
    setValue('FAQ', `a${next}`, '');
  };

  const deleteFaqItem = (index: number) => {
    setFormData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const locData = next['FAQ']?.[activeLocale] || {};
      const total = getFaqCount();

      // Remove the target and shift subsequent items down
      for (let i = index; i < total; i++) {
        locData[`q${i}`] = locData[`q${i + 1}`] || '';
        locData[`a${i}`] = locData[`a${i + 1}`] || '';
      }
      delete locData[`q${total}`];
      delete locData[`a${total}`];

      if (!next['FAQ']) next['FAQ'] = {};
      next['FAQ'][activeLocale] = locData;
      return next;
    });
  };

  // ─── Trust Logo Dynamic Helpers ──────────────────────────────────
  const getTrustLogoCount = (): number => {
    const data = formData['Trust']?.[activeLocale] || {};
    let max = 0;
    for (const key of Object.keys(data)) {
      const match = key.match(/^logo(\d+)$/);
      if (match) max = Math.max(max, parseInt(match[1], 10));
    }
    return max;
  };

  const addTrustLogo = () => {
    const next = getTrustLogoCount() + 1;
    setValue('Trust', `logo${next}`, '');
  };

  const deleteTrustLogo = (index: number) => {
    setFormData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const locData = next['Trust']?.[activeLocale] || {};
      const total = getTrustLogoCount();
      for (let i = index; i < total; i++) {
        locData[`logo${i}`] = locData[`logo${i + 1}`] || '';
      }
      delete locData[`logo${total}`];
      if (!next['Trust']) next['Trust'] = {};
      next['Trust'][activeLocale] = locData;
      return next;
    });
  };

  const handleTrustLogoUpload = async (index: number, file: File) => {
    const token = getToken();
    if (!token) return;
    const result = await uploadCmsImage(file, token);
    if (result.ok && result.url) {
      setValue('Trust', `logo${index}`, result.url, true);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#162C66]" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black text-[#162C66] mb-2">{t('cmsLandingPage')}</h1>
        <p className="text-slate-500 font-medium">{t('cmsLandingPageDesc')}</p>
      </div>

      {/* Language Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 mb-8 inline-flex shadow-sm">
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

      {/* Section Editors */}
      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const isOpen = openSections[section.id] || false;
          const changed = hasChanges(section.id);
          const isSaving = saving === section.id;
          const isSaved = saved === section.id;
          const filledCount = section.fields.filter((f) => getValue(section.id, f.key)).length;

          return (
            <div
              key={section.id}
              className={clsx(
                'bg-white rounded-2xl border transition-all duration-200',
                changed ? 'border-[#F5C400] shadow-md shadow-[#F5C400]/10' : 'border-slate-200',
                isOpen && 'shadow-lg'
              )}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5 lg:p-6 text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                    isOpen ? 'bg-[#162C66] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-[#162C66]/10 group-hover:text-[#162C66]'
                  )}>
                    <Type size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#162C66]">{section.label}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {section.description}
                      {filledCount > 0 && (
                        <span className="ml-2 text-[#F5C400] font-bold">
                          {filledCount}/{section.fields.length} Felder
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {changed && (
                    <span className="text-xs font-bold text-[#F5C400] bg-[#F5C400]/10 px-2.5 py-1 rounded-full">
                      Geändert
                    </span>
                  )}
                  <ChevronDown
                    size={20}
                    className={clsx(
                      'text-slate-400 transition-transform duration-300',
                      isOpen && 'rotate-180'
                    )}
                  />
                </div>
              </button>

              {/* Section Content */}
              {isOpen && (
                <div className="px-5 lg:px-6 pb-6 border-t border-slate-100 pt-5">
                  {/* Static fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {section.fields.map((field) => (
                      <div
                        key={field.key}
                        className={clsx(
                          field.type === 'textarea' && 'lg:col-span-2',
                          field.type === 'image' && 'lg:col-span-2'
                        )}
                      >
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">
                          {field.label}
                          <span className="text-slate-300 font-normal ml-1 text-xs">{field.key}</span>
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={getValue(section.id, field.key)}
                            onChange={(e) => setValue(section.id, field.key, e.target.value)}
                            placeholder={getDefault(section.id, field.key) || field.placeholder || `${field.label}...`}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none transition-all resize-y"
                          />
                        ) : field.type === 'image' ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <input
                                type="text"
                                value={getValue(section.id, field.key)}
                                onChange={(e) => setValue(section.id, field.key, e.target.value)}
                                placeholder="Bild-URL oder Upload..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none transition-all"
                              />
                              <label className="cursor-pointer flex items-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors">
                                <Upload size={16} />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(section.id, field.key, file);
                                  }}
                                />
                              </label>
                            </div>
                            {getValue(section.id, field.key) && (
                              <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200">
                                <img
                                  src={getValue(section.id, field.key).startsWith('/uploads/') ? `${API_URL}${getValue(section.id, field.key)}` : getValue(section.id, field.key)}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => setValue(section.id, field.key, '')}
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={getValue(section.id, field.key)}
                            onChange={(e) => setValue(section.id, field.key, e.target.value)}
                            placeholder={getDefault(section.id, field.key) || field.placeholder || `${field.label}...`}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none transition-all"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Trust Logos */}
                  {section.id === 'Trust' && section.dynamic && (
                    <div className="mt-6 space-y-4">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Partner-Logos</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: getTrustLogoCount() }, (_, i) => i + 1).map((n) => {
                          const logoUrl = getValue('Trust', `logo${n}`);
                          const fullUrl = logoUrl?.startsWith('/uploads/') ? `${API_URL}${logoUrl}` : logoUrl;
                          return (
                            <div key={n} className="relative group bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col items-center gap-2">
                              <button
                                type="button"
                                onClick={() => deleteTrustLogo(n)}
                                className="absolute top-2 right-2 w-7 h-7 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                                title="Logo entfernen"
                              >
                                <Trash2 size={12} />
                              </button>
                              {fullUrl ? (
                                <img src={fullUrl} alt={`Logo ${n}`} className="h-16 w-auto max-w-full object-contain" />
                              ) : (
                                <div className="h-16 w-full flex items-center justify-center">
                                  <ImageIcon size={24} className="text-slate-300" />
                                </div>
                              )}
                              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors">
                                <Upload size={12} />
                                <span>{logoUrl ? 'Ersetzen' : 'Upload'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleTrustLogoUpload(n, file);
                                  }}
                                />
                              </label>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={addTrustLogo}
                        className="flex items-center space-x-2 px-5 py-3 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1f3c8a] transition-colors shadow-md"
                      >
                        <Plus size={16} />
                        <span>Logo hinzufügen</span>
                      </button>

                      {/* Active Ad Placements */}
                      <div className="mt-8 pt-6 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Megaphone size={16} className="text-amber-500" />
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Bezahlte Werbeplätze</p>
                            {activeAds.length > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{activeAds.length} aktiv</span>
                            )}
                          </div>
                          <Link
                            href="/admin/ad-placements"
                            className="flex items-center gap-1.5 text-xs font-bold text-[#162C66] hover:text-blue-700 transition-colors"
                          >
                            Verwalten <ExternalLink size={12} />
                          </Link>
                        </div>
                        {activeAds.length === 0 ? (
                          <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                            <Megaphone size={24} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">Keine aktiven Werbeplätze</p>
                            <Link href="/admin/ad-placements" className="text-xs font-bold text-[#162C66] hover:underline mt-1 inline-block">
                              Werbung verwalten →
                            </Link>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {activeAds.map((ad) => {
                              const logoFull = ad.logoUrl?.startsWith('/uploads/') ? `${API_URL}${ad.logoUrl}` : ad.logoUrl;
                              return (
                                <div key={ad.id} className="relative bg-emerald-50/50 rounded-xl border border-emerald-200 p-3 flex flex-col items-center gap-2">
                                  <span className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600">AD</span>
                                  {logoFull ? (
                                    <img src={logoFull} alt={ad.companyName} className="h-16 w-auto max-w-full object-contain" />
                                  ) : (
                                    <div className="h-16 w-full flex items-center justify-center">
                                      <Building2 size={24} className="text-emerald-300" />
                                    </div>
                                  )}
                                  <p className="text-[11px] font-bold text-slate-600 truncate w-full text-center">{ad.companyName}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dynamic FAQ Q&A Pairs */}
                  {section.id === 'FAQ' && section.dynamic && (
                    <div className="mt-6 space-y-4">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Fragen & Antworten</p>
                      {Array.from({ length: getFaqCount() }, (_, i) => i + 1).map((n) => (
                        <div key={n} className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative group">
                          <button
                            type="button"
                            onClick={() => deleteFaqItem(n)}
                            className="absolute top-3 right-3 w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            title="Frage löschen"
                          >
                            <Trash2 size={14} />
                          </button>
                          <label className="block text-xs font-bold text-[#162C66] mb-1.5">Frage {n}</label>
                          <input
                            type="text"
                            value={getValue('FAQ', `q${n}`)}
                            onChange={(e) => setValue('FAQ', `q${n}`, e.target.value)}
                            placeholder={`Frage ${n} eingeben...`}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none transition-all mb-3"
                          />
                          <label className="block text-xs font-bold text-[#162C66] mb-1.5">Antwort {n}</label>
                          <textarea
                            value={getValue('FAQ', `a${n}`)}
                            onChange={(e) => setValue('FAQ', `a${n}`, e.target.value)}
                            placeholder={`Antwort ${n} eingeben...`}
                            rows={2}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none transition-all resize-y"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addFaqItem}
                        className="flex items-center space-x-2 px-5 py-3 bg-[#162C66] text-white rounded-xl text-sm font-bold hover:bg-[#1f3c8a] transition-colors shadow-md"
                      >
                        <Plus size={16} />
                        <span>Frage hinzufügen</span>
                      </button>
                    </div>
                  )}

                  {/* Section Actions */}
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
                    <button
                      onClick={() => handleReset(section.id)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                    >
                      <RotateCcw size={16} />
                      <span>{t('cmsResetSection')}</span>
                    </button>
                    <button
                      onClick={() => handleSave(section.id)}
                      disabled={isSaving || !changed}
                      className={clsx(
                        'flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                        isSaved
                          ? 'bg-green-500 text-white'
                          : changed
                            ? 'bg-[#162C66] text-white hover:bg-[#1f3c8a] shadow-md'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>{t('cmsSaving')}</span>
                        </>
                      ) : isSaved ? (
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
