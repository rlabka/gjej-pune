'use client';

import { useEffect, useState } from 'react';
import { getThemeConfig } from '@/lib/siteConfig';
import { CONFIG_UPDATED_EVENT } from '@/lib/siteConfig';

function normalizeFontStack(value: string | undefined) {
  if (!value) return '';

  const v = value.trim();
  if (!v) return '';

  // If already using CSS variables, keep as-is.
  if (v.includes('var(--font-')) return v;

  // Backwards-compat for previously stored values.
  if (v === 'Inter, system-ui, sans-serif') return 'var(--font-inter), system-ui, sans-serif';
  if (v === 'Roboto, sans-serif') return 'var(--font-roboto), system-ui, sans-serif';
  if (v === '"Open Sans", sans-serif') return 'var(--font-open-sans), system-ui, sans-serif';

  return v;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const apply = () => {
      const theme = getThemeConfig();
      const root = document.documentElement;
      root.style.setProperty('--background', theme.background);
      root.style.setProperty('--foreground', theme.foreground);
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--secondary', theme.secondary);
      root.style.setProperty('--accent', theme.accent);
      root.style.setProperty('--neutral-bg', theme.neutralBg);
      root.style.setProperty('--radius', theme.borderRadius || '0.75rem');
      document.body.style.fontFamily = normalizeFontStack(theme.bodyFont);
      const styleId = 'admin-theme-headings';
      let el = document.getElementById(styleId);
      const headingFont = normalizeFontStack(theme.headingFont);
      if (headingFont) {
        if (!el) {
          el = document.createElement('style');
          el.id = styleId;
          document.head.appendChild(el);
        }
        el.textContent = `h1, h2, h3, h4, h5, h6 { font-family: ${headingFont}; }`;
      } else if (el) {
        el.remove();
      }
      const faviconId = 'admin-theme-favicon';
      let link = document.getElementById(faviconId) as HTMLLinkElement | null;
      if (theme.faviconUrl) {
        if (!link) {
          link = document.createElement('link');
          link.id = faviconId;
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = theme.faviconUrl;
      } else if (link) {
        link.remove();
      }
    };

    setMounted(true);
    apply();
    const handler = () => apply();
    window.addEventListener(CONFIG_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handler);
  }, []);

  if (!mounted) return <>{children}</>;
  return <>{children}</>;
}
