'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { getToken } from '@/lib/auth';
import { saveCmsContent, type CmsItem } from '@/lib/cms';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  Loader2,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  Target,
  Heart,
  MessageSquare,
  Share2,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const LOCALES = ['de', 'en', 'fr', 'it', 'sq'] as const;
const LOCALE_LABELS: Record<string, string> = { de: 'Deutsch', en: 'English', fr: 'Français', it: 'Italiano', sq: 'Shqip' };

type PageTab = 'about' | 'contact' | 'social';

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'richText';
  placeholder?: string;
  icon?: typeof FileText;
  rows?: number;
  hint?: string;
}

const ABOUT_FIELDS: FieldDef[] = [
  { key: 'title', label: 'Seitentitel', type: 'text', placeholder: 'Über uns', icon: FileText },
  { key: 'subtitle', label: 'Untertitel', type: 'text', placeholder: 'Wir verbinden Talente...', icon: FileText },
  { key: 'badge', label: 'Badge (Hero)', type: 'text', placeholder: 'Seit 2024 vertrauenswürdig' },
  { key: 'mission_title', label: 'Mission — Titel', type: 'text', placeholder: 'Unsere Mission', icon: Target },
  { key: 'mission_text', label: 'Mission — Text', type: 'textarea', placeholder: 'Beschreibung der Mission...', rows: 4 },
  { key: 'mission_html', label: 'Mission — HTML (überschreibt Text)', type: 'richText', placeholder: '<p>HTML Inhalt...</p>', rows: 8 },
  { key: 'mission_quote', label: 'Mission — Zitat', type: 'textarea', placeholder: 'Wir glauben, dass der richtige Job...', rows: 3 },
  { key: 'founder_label', label: 'Gründer-Label', type: 'text', placeholder: 'Gründerteam' },
  { key: 'values_title', label: 'Werte — Titel', type: 'text', placeholder: 'Unsere Werte', icon: Heart },
  { key: 'values_subtitle', label: 'Werte — Untertitel', type: 'text', placeholder: 'Die Prinzipien, die unser Handeln leiten' },
  { key: 'value1_title', label: 'Wert 1 — Titel', type: 'text', placeholder: 'Transparenz' },
  { key: 'value1_text', label: 'Wert 1 — Text', type: 'textarea', placeholder: 'Beschreibung...', rows: 2 },
  { key: 'value2_title', label: 'Wert 2 — Titel', type: 'text', placeholder: 'Innovation' },
  { key: 'value2_text', label: 'Wert 2 — Text', type: 'textarea', placeholder: 'Beschreibung...', rows: 2 },
  { key: 'value3_title', label: 'Wert 3 — Titel', type: 'text', placeholder: 'Vertrauen' },
  { key: 'value3_text', label: 'Wert 3 — Text', type: 'textarea', placeholder: 'Beschreibung...', rows: 2 },
  { key: 'value4_title', label: 'Wert 4 — Titel', type: 'text', placeholder: 'Vielfalt' },
  { key: 'value4_text', label: 'Wert 4 — Text', type: 'textarea', placeholder: 'Beschreibung...', rows: 2 },
  { key: 'team_title', label: 'Team — Titel', type: 'text', placeholder: 'Unser Team', icon: Users },
  { key: 'team_text', label: 'Team — Text', type: 'textarea', placeholder: 'Beschreibung des Teams...', rows: 4 },
  { key: 'team_html', label: 'Team — HTML (überschreibt Text)', type: 'richText', placeholder: '<p>HTML Inhalt...</p>', rows: 8 },
  { key: 'dept1', label: 'Abteilung 1', type: 'text', placeholder: 'Engineering' },
  { key: 'dept2', label: 'Abteilung 2', type: 'text', placeholder: 'Design' },
  { key: 'dept3', label: 'Abteilung 3', type: 'text', placeholder: 'HR & Support' },
  { key: 'dept4', label: 'Abteilung 4', type: 'text', placeholder: 'Data & Analytics' },
  { key: 'card_support_value', label: 'Support-Karte — Wert', type: 'text', placeholder: '24/7' },
  { key: 'card_support_label', label: 'Support-Karte — Label', type: 'text', placeholder: 'Support' },
  { key: 'card_languages_title', label: 'Sprachen-Karte — Titel', type: 'text', placeholder: '5 Sprachen' },
  { key: 'card_languages_desc', label: 'Sprachen-Karte — Beschreibung', type: 'text', placeholder: 'Mehrsprachige Plattform' },
  { key: 'card_gdpr_title', label: 'DSGVO-Karte — Titel', type: 'text', placeholder: 'DSGVO-konform' },
  { key: 'card_gdpr_desc', label: 'DSGVO-Karte — Beschreibung', type: 'text', placeholder: 'Datenschutz garantiert' },
  { key: 'card_security_value', label: 'Sicherheits-Karte — Wert', type: 'text', placeholder: 'A+' },
  { key: 'card_security_label', label: 'Sicherheits-Karte — Label', type: 'text', placeholder: 'Sicherheitsrating' },
  { key: 'stat1_value', label: 'Statistik 1 — Wert', type: 'text', placeholder: '10.000+', icon: TrendingUp },
  { key: 'stat1_label', label: 'Statistik 1 — Label', type: 'text', placeholder: 'Registrierte Nutzer' },
  { key: 'stat2_value', label: 'Statistik 2 — Wert', type: 'text', placeholder: '5.000+' },
  { key: 'stat2_label', label: 'Statistik 2 — Label', type: 'text', placeholder: 'Stellenangebote' },
  { key: 'stat3_value', label: 'Statistik 3 — Wert', type: 'text', placeholder: '500+' },
  { key: 'stat3_label', label: 'Statistik 3 — Label', type: 'text', placeholder: 'Unternehmen' },
  { key: 'stat4_value', label: 'Statistik 4 — Wert', type: 'text', placeholder: '98%' },
  { key: 'stat4_label', label: 'Statistik 4 — Label', type: 'text', placeholder: 'Zufriedenheit' },
  { key: 'cta_title', label: 'CTA — Titel', type: 'text', placeholder: 'Bereit für den nächsten Schritt?' },
  { key: 'cta_text', label: 'CTA — Text', type: 'text', placeholder: 'Registrieren Sie sich kostenlos...' },
  { key: 'cta_button', label: 'CTA — Button-Text', type: 'text', placeholder: 'Jetzt registrieren' },
  { key: 'cta_contact', label: 'CTA — Kontakt-Button', type: 'text', placeholder: 'Kontaktieren Sie uns' },
];

const CONTACT_FIELDS: FieldDef[] = [
  { key: 'email', label: 'Kontakt E-Mail', type: 'text', placeholder: 'info@gjej-pune.com', icon: Mail },
  { key: 'phone', label: 'Kontakt Telefon', type: 'text', placeholder: '+41 44 000 00 00', icon: Phone },

  { key: 'hours', label: 'Öffnungszeiten', type: 'text', placeholder: 'Mo–Fr: 09:00–18:00', icon: Clock },
];

const SOCIAL_FIELDS: FieldDef[] = [
  { key: 'facebook', label: 'Facebook', type: 'text', placeholder: 'https://facebook.com/gjejpune24', icon: Facebook, hint: 'Leer lassen um auszublenden' },
  { key: 'instagram', label: 'Instagram', type: 'text', placeholder: 'https://instagram.com/gjejpune24', icon: Instagram, hint: 'Leer lassen um auszublenden' },
  { key: 'linkedin', label: 'LinkedIn', type: 'text', placeholder: 'https://linkedin.com/company/gjejpune24', icon: Linkedin, hint: 'Leer lassen um auszublenden' },
  { key: 'twitter', label: 'X / Twitter', type: 'text', placeholder: 'https://x.com/gjejpune24', icon: Twitter, hint: 'Leer lassen um auszublenden' },
  { key: 'tiktok', label: 'TikTok', type: 'text', placeholder: 'https://tiktok.com/@gjejpune24', hint: 'Leer lassen um auszublenden' },
  { key: 'youtube', label: 'YouTube', type: 'text', placeholder: 'https://youtube.com/@gjejpune24', icon: Youtube, hint: 'Leer lassen um auszublenden' },
];

type FormData = Record<string, Record<string, string>>;

export default function AdminPagesPage() {
  const currentLocale = useLocale();
  const [activeLocale, setActiveLocale] = useState<string>(currentLocale);
  const [activeTab, setActiveTab] = useState<PageTab>('about');
  const [formData, setFormData] = useState<FormData>({});
  const [originalData, setOriginalData] = useState<FormData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const section = activeTab === 'about' ? 'AboutUs' : activeTab === 'contact' ? 'Contact' : 'SocialLinks';
  const fields = activeTab === 'about' ? ABOUT_FIELDS : activeTab === 'contact' ? CONTACT_FIELDS : SOCIAL_FIELDS;
  const isSocial = activeTab === 'social';

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [aboutRes, contactRes, socialRes] = await Promise.all([
        fetch(`${API_URL}/api/cms/content/AboutUs`),
        fetch(`${API_URL}/api/cms/content/Contact`),
        fetch(`${API_URL}/api/cms/content/SocialLinks`),
      ]);
      const aboutData = await aboutRes.json();
      const contactData = await contactRes.json();
      const socialData = await socialRes.json();

      const fd: FormData = {};
      const processItems = (items: CmsItem[], prefix: string) => {
        for (const item of items) {
          const key = `${prefix}__${item.locale}`;
          if (!fd[key]) fd[key] = {};
          fd[key][item.fieldKey] = item.value;
        }
      };

      if (aboutData.ok) processItems(aboutData.content, 'AboutUs');
      if (contactData.ok) processItems(contactData.content, 'Contact');
      if (socialData.ok) processItems(socialData.content, 'SocialLinks');

      setFormData(fd);
      setOriginalData(JSON.parse(JSON.stringify(fd)));
    } catch (err) {
      console.error('[Pages Editor] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);

  const effectiveLocale = isSocial ? 'de' : activeLocale;
  const dataKey = `${section}__${effectiveLocale}`;

  const getValue = (fieldKey: string): string => {
    return formData[dataKey]?.[fieldKey] || '';
  };

  const setValue = (fieldKey: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (!next[dataKey]) next[dataKey] = {};
      next[dataKey] = { ...next[dataKey], [fieldKey]: value };
      return next;
    });
  };

  const hasChanges = (): boolean => {
    const current = JSON.stringify(formData[dataKey] || {});
    const original = JSON.stringify(originalData[dataKey] || {});
    return current !== original;
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    try {
      const items = fields
        .filter((f) => getValue(f.key) !== (originalData[dataKey]?.[f.key] || ''))
        .map((f) => ({
          section,
          fieldKey: f.key,
          locale: effectiveLocale,
          value: getValue(f.key),
          type: f.type === 'richText' ? 'richText' : 'text',
        }));

      if (items.length === 0) { setSaving(false); return; }

      const result = await saveCmsContent(items, token);
      if (result.ok) {
        setOriginalData((prev) => {
          const next = JSON.parse(JSON.stringify(prev));
          next[dataKey] = { ...(next[dataKey] || {}), ...(formData[dataKey] || {}) };
          return next;
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error('[Pages Editor] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const items = fields.map((f) => ({
        section,
        fieldKey: f.key,
        locale: effectiveLocale,
        value: '',
        type: 'text',
      }));
      await saveCmsContent(items, token);

      setFormData((prev) => {
        const next = { ...prev };
        delete next[dataKey];
        return { ...next };
      });
      setOriginalData((prev) => {
        const next = { ...prev };
        delete next[dataKey];
        return { ...next };
      });
    } catch (err) {
      console.error('[Pages Editor] Reset error:', err);
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
        <h1 className="text-2xl lg:text-3xl font-black text-[#162C66] mb-2">Seiten verwalten</h1>
        <p className="text-slate-500 font-medium">Inhalte der Seiten und Social-Media-Links bearbeiten</p>
      </div>

      {/* Page Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {([
          { id: 'about' as PageTab, label: 'Über uns', icon: Users, desc: 'Mission, Werte, Team' },
          { id: 'contact' as PageTab, label: 'Kontakt', icon: MessageSquare, desc: 'E-Mail, Telefon, Adresse' },
          { id: 'social' as PageTab, label: 'Social Media', icon: Share2, desc: 'Facebook, Instagram, etc.' },
        ]).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center space-x-3 px-5 py-4 rounded-2xl border transition-all font-bold text-sm',
                isActive
                  ? 'bg-white border-[#162C66] text-[#162C66] shadow-lg'
                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
              )}
            >
              <Icon size={20} />
              <div className="text-left">
                <span className="block">{tab.label}</span>
                <span className="text-xs opacity-60 font-medium mt-0.5 block">{tab.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Language Tabs (hidden for social links) */}
      {!isSocial && (
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
      )}

      {/* Editor */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#162C66]">
            {activeTab === 'about' ? 'Über uns' : activeTab === 'contact' ? 'Kontakt' : 'Social-Media-Links'}
            {!isSocial && ` — ${LOCALE_LABELS[activeLocale]}`}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isSocial
              ? 'Geben Sie die vollständige URL ein. Leere Felder werden im Footer ausgeblendet.'
              : 'Leere Felder verwenden die Standard-Texte. Füllen Sie nur Felder aus, die Sie überschreiben möchten.'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {fields.map((field) => {
            const Icon = field.icon;
            const val = getValue(field.key);
            return (
              <div key={field.key}>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {Icon && <Icon size={14} className="text-slate-400" />}
                  {field.label}
                  {isSocial && val && val.trim() !== '' && (
                    <span className="ml-auto text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full normal-case tracking-normal">Sichtbar</span>
                  )}
                  {isSocial && (!val || val.trim() === '') && (
                    <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full normal-case tracking-normal">Ausgeblendet</span>
                  )}
                </label>
                {field.hint && (
                  <p className="text-[11px] text-slate-400 mb-1.5 font-medium">{field.hint}</p>
                )}
                {field.type === 'text' ? (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none transition-all"
                  />
                ) : (
                  <>
                    {field.type === 'richText' && (
                      <p className="text-[11px] text-slate-400 mb-1.5 font-medium">
                        HTML erlaubt: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;
                      </p>
                    )}
                    <textarea
                      value={val}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows || 4}
                      className={clsx(
                        'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-[#162C66] placeholder:text-slate-300 focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/10 outline-none transition-all resize-y leading-relaxed',
                        field.type === 'richText' ? 'font-mono' : 'font-medium'
                      )}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
          >
            <RotateCcw size={16} />
            <span>Alle zurücksetzen</span>
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
              <><Loader2 size={16} className="animate-spin" /><span>Speichern…</span></>
            ) : saved ? (
              <><CheckCircle2 size={16} /><span>Gespeichert!</span></>
            ) : (
              <><Save size={16} /><span>Speichern</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
