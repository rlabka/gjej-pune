'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Palette, Type, Image as ImageIcon, Monitor, Save, RotateCcw } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  getThemeConfig,
  setThemeConfig,
  resetThemeConfig,
  CONFIG_UPDATED_EVENT,
  type ThemeConfig
} from '@/lib/siteConfig';

const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const FONT_OPTIONS = [
  { value: SYSTEM_FONT, labelKey: 'fontSystemDefault' as const },
  { value: 'var(--font-inter), system-ui, sans-serif', labelKey: 'fontInter' as const },
  { value: 'var(--font-plus-jakarta), var(--font-inter), system-ui, sans-serif', labelKey: 'fontPlusJakartaSans' as const },
  { value: 'var(--font-roboto), system-ui, sans-serif', labelKey: 'fontRoboto' as const },
  { value: 'var(--font-open-sans), system-ui, sans-serif', labelKey: 'fontOpenSans' as const }
] as const;

const RADIUS_OPTIONS = [
  { value: '0px', labelKey: 'radiusNone' as const },
  { value: '0.25rem', labelKey: 'radiusSm' as const },
  { value: '0.5rem', labelKey: 'radiusMd' as const },
  { value: '0.75rem', labelKey: 'radiusLg' as const },
  { value: '1rem', labelKey: 'radiusXl' as const },
  { value: '9999px', labelKey: 'radiusFull' as const }
] as const;

export default function AdminThemePage() {
  const t = useTranslations('Admin');
  const [config, setConfig] = useState<ThemeConfig>(getThemeConfig());
  const [saved, setSaved] = useState(false);

  const loadConfig = useCallback(() => {
    setConfig(getThemeConfig());
  }, []);

  useEffect(() => {
    loadConfig();
    const handler = () => loadConfig();
    window.addEventListener(CONFIG_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handler);
  }, [loadConfig]);

  const handleSave = () => {
    setThemeConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetThemeConfig();
    loadConfig();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#162C66]">{t('themeSection')}</h2>
          <p className="text-slate-600 mt-1">{t('themeDescription')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {t('reset')}
          </Button>
          <Button variant="primary" onClick={handleSave} className="gap-2 shadow-lg shadow-yellow-400/20">
            <Save className="w-4 h-4" />
            {saved ? t('savedSuccess') : t('save')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="xl:col-span-2 space-y-6">
          {/* Branding Section */}
          <Card className="overflow-hidden border-t-4 border-t-[#162C66]">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Monitor className="w-5 h-5 text-[#162C66]" />
              </div>
              <h3 className="text-lg font-bold text-[#162C66]">{t('brandingSection')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('siteName')}</label>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => setConfig((c) => ({ ...c, siteName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="gjej-pune.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('tagline')}</label>
                <input
                  type="text"
                  value={config.tagline}
                  onChange={(e) => setConfig((c) => ({ ...c, tagline: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  placeholder={t('taglinePlaceholder')}
                />
              </div>
            </div>
          </Card>

          {/* Colors Section */}
          <Card className="overflow-hidden border-t-4 border-t-[#F5C400]">
             <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <div className="bg-yellow-50 p-2 rounded-lg">
                <Palette className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-[#162C66]">{t('colors')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(['primary', 'secondary', 'accent', 'background', 'foreground', 'neutralBg'] as const).map((key) => (
                <div key={key} className="group">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t(key)}</label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={config[key]}
                        onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
                        className="w-12 h-12 rounded-xl border-2 border-white shadow-sm cursor-pointer p-0 overflow-hidden"
                      />
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-inset ring-black/10"
                      />
                    </div>
                    <input
                      type="text"
                      value={config[key]}
                      onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Typography & Shape */}
          <Card className="overflow-hidden border-t-4 border-t-slate-400">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Type className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-[#162C66]">{t('fonts')} & Shape</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('headingFont')}</label>
                <select
                  value={config.headingFont}
                  onChange={(e) => setConfig((c) => ({ ...c, headingFont: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value || 'default'} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('bodyFont')}</label>
                <select
                  value={config.bodyFont}
                  onChange={(e) => setConfig((c) => ({ ...c, bodyFont: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value || 'default'} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('borderRadius')}</label>
                <select
                  value={config.borderRadius || '0.75rem'}
                  onChange={(e) => setConfig((c) => ({ ...c, borderRadius: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                >
                  {RADIUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Images Section */}
          <Card className="overflow-hidden">
             <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <div className="bg-purple-50 p-2 rounded-lg">
                <ImageIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-[#162C66]">{t('images')}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('logoUrl')}</label>
                <input
                  type="url"
                  value={config.logoUrl}
                  onChange={(e) => setConfig((c) => ({ ...c, logoUrl: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  placeholder="/logo.png"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('faviconUrl')}</label>
                <input
                  type="url"
                  value={config.faviconUrl}
                  onChange={(e) => setConfig((c) => ({ ...c, faviconUrl: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  placeholder="/favicon.ico"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('heroImageUrl')}</label>
                <input
                  type="url"
                  value={config.heroImageUrl}
                  onChange={(e) => setConfig((c) => ({ ...c, heroImageUrl: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  placeholder={t('heroImagePlaceholder')}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Preview (First on mobile, Last on Desktop) */}
        <div className="xl:col-span-1 order-first xl:order-last">
          <div className="xl:sticky xl:top-6">
             <Card className="border-0 shadow-xl ring-1 ring-slate-900/5 bg-slate-50 overflow-hidden">
              <div className="mb-4">
                <h3 className="text-lg font-black text-[#162C66]">{t('preview')}</h3>
                <p className="text-xs text-slate-500">{t('previewDescription')}</p>
              </div>

              {/* Mini Browser Window */}
              <div 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                style={{ borderRadius: config.borderRadius || '0.75rem' }}
              >
                {/* Header */}
                <div 
                  className="h-12 border-b flex items-center px-4 justify-between"
                  style={{ backgroundColor: config.background, borderColor: config.neutralBg }}
                >
                  <div className="flex items-center gap-2">
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="h-6 w-auto" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-slate-200" style={{ borderRadius: config.borderRadius }} />
                    )}
                    <span className="text-xs font-bold" style={{ color: config.foreground }}>{config.siteName}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-12 h-2 rounded-full bg-slate-100" />
                    <div className="w-12 h-2 rounded-full bg-slate-100" />
                  </div>
                </div>

                {/* Hero */}
                <div 
                  className="p-6 text-center"
                  style={{ 
                    backgroundColor: config.neutralBg,
                    fontFamily: config.bodyFont
                  }}
                >
                  <h1 
                    className="text-xl font-bold mb-2"
                    style={{ 
                      color: config.secondary, 
                      fontFamily: config.headingFont 
                    }}
                  >
                    Find your dream job
                  </h1>
                  <p 
                    className="text-xs mb-4 opacity-80"
                    style={{ color: config.foreground }}
                  >
                    {config.tagline || 'Connect with the best employers in Switzerland.'}
                  </p>
                  <button
                    className="px-4 py-1.5 text-xs font-bold"
                    style={{ 
                      backgroundColor: config.primary, 
                      color: config.secondary,
                      borderRadius: config.borderRadius || '0.75rem'
                    }}
                  >
                    Get Started
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3" style={{ backgroundColor: config.background }}>
                  <div 
                    className="p-3 border flex items-center gap-3"
                    style={{ 
                      borderColor: config.neutralBg,
                      borderRadius: config.borderRadius || '0.75rem'
                    }}
                  >
                     <div 
                       className="w-8 h-8 shrink-0"
                       style={{ 
                         backgroundColor: config.secondary,
                         borderRadius: config.borderRadius || '0.75rem'
                       }}
                     />
                     <div className="space-y-1 w-full">
                       <div className="w-3/4 h-2 bg-slate-100 rounded-full" />
                       <div className="w-1/2 h-2 bg-slate-50 rounded-full" />
                     </div>
                  </div>

                   <div 
                    className="p-3 border flex items-center gap-3"
                    style={{ 
                      borderColor: config.neutralBg,
                      borderRadius: config.borderRadius || '0.75rem'
                    }}
                  >
                     <div 
                       className="w-8 h-8 shrink-0"
                       style={{ 
                         backgroundColor: config.accent,
                         borderRadius: config.borderRadius || '0.75rem'
                       }}
                     />
                     <div className="space-y-1 w-full">
                       <div className="w-3/4 h-2 bg-slate-100 rounded-full" />
                       <div className="w-1/2 h-2 bg-slate-50 rounded-full" />
                     </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
