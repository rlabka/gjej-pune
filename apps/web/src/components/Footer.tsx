'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LanguageSwitcher from './LanguageSwitcher';
import { getThemeConfig, CONFIG_UPDATED_EVENT } from '@/lib/siteConfig';
import { useState, useEffect } from 'react';
import { Linkedin, Twitter, Instagram, Facebook } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export default function Footer() {
  const t = useTranslations('Footer');
  const [theme, setTheme] = useState(getThemeConfig());
  const [social, setSocial] = useState<SocialLinks>({});

  useEffect(() => {
    setTheme(getThemeConfig());
    const handler = () => setTheme(getThemeConfig());
    window.addEventListener(CONFIG_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handler);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/cms/content/SocialLinks`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.content) {
          const links: SocialLinks = {};
          for (const item of data.content) {
            (links as any)[item.fieldKey] = item.value;
          }
          setSocial(links);
        }
      })
      .catch(() => {});
  }, []);

  const siteName = theme.siteName || 'gjej-pune.com';
  const logoUrl = theme.logoUrl || '/logo.png';

  const socialItems = [
    { key: 'facebook', url: social.facebook, icon: Facebook, label: 'Facebook' },
    { key: 'instagram', url: social.instagram, icon: Instagram, label: 'Instagram' },
    { key: 'linkedin', url: social.linkedin, icon: Linkedin, label: 'LinkedIn' },
    { key: 'twitter', url: social.twitter, icon: Twitter, label: 'X / Twitter' },
    { key: 'tiktok', url: social.tiktok, icon: null, label: 'TikTok' },
    { key: 'youtube', url: social.youtube, icon: null, label: 'YouTube' },
  ].filter(s => s.url && s.url.trim() !== '');

  return (
    <footer
      className="theme-footer text-white pt-16 pb-8 border-t border-white/10 bg-gradient-to-b from-[#1a3570] via-[#162C66] to-[#0F2050]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block bg-white px-4 py-2 rounded-xl group mb-6">
              <img
                src={logoUrl}
                alt={siteName}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm mb-8">
              {t('description')}
            </p>
            {socialItems.length > 0 && (
              <div className="flex items-center gap-3 text-white/60">
                {socialItems.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.key}
                      href={s.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 hover:text-[#F5C400] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    >
                      {Icon ? (
                        <Icon size={18} />
                      ) : s.key === 'tiktok' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.15a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.58z"/></svg>
                      ) : s.key === 'youtube' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                      ) : null}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-semibold text-sm text-white/90 mb-5 tracking-wide">{t('platform')}</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link href="#jobs" className="hover:text-[#F5C400] transition-colors duration-150 ease-out">{t('jobs')}</Link></li>
              <li><Link href="#companies" className="hover:text-[#F5C400] transition-colors duration-150 ease-out">{t('companies')}</Link></li>
              <li><Link href="#how-it-works" className="hover:text-[#F5C400] transition-colors duration-150 ease-out">{t('howItWorks')}</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-semibold text-sm text-white/90 mb-5 tracking-wide">{t('company')}</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link href="/about" className="hover:text-[#F5C400] transition-colors duration-150 ease-out">{t('about')}</Link></li>
              <li><Link href="/contact" className="hover:text-[#F5C400] transition-colors duration-150 ease-out">{t('contact')}</Link></li>
              <li><Link href="/datenschutz" className="hover:text-[#F5C400] transition-colors duration-150 ease-out">{t('privacy')}</Link></li>
              <li><Link href="/agb" className="hover:text-[#F5C400] transition-colors duration-150 ease-out">{t('agb')}</Link></li>
              <li><Link href="/impressum" className="hover:text-[#F5C400] transition-colors duration-150 ease-out">{t('impression')}</Link></li>
            </ul>
          </div>

          {/* Language Column */}
          <div>
            <h4 className="font-semibold text-sm text-white/90 mb-5 tracking-wide">{t('selectLanguage')}</h4>
            <LanguageSwitcher variant="list" />
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/55 text-xs">
            {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
