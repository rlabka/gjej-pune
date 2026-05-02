import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { config } from '@/lib/config';
import { storage } from '@/lib/storage';

import de from '../messages/de.json';
import en from '../messages/en.json';
import fr from '../messages/fr.json';
import it from '../messages/it.json';
import sq from '../messages/sq.json';

export const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'it', 'sq'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_KEY = 'app.locale';

export const i18n = new I18n({ de, en, fr, it, sq });
i18n.enableFallback = true;
i18n.defaultLocale = config.defaultLocale;
// Support `{name}` placeholders (next-intl-style) in addition to `{{name}}` / `%{name}`
i18n.placeholder = /(?:\{\{|%\{|\{)([^{}]+?)(?:\}\}|\})/g;

/**
 * Initial locale resolution:
 *   1. User-chosen locale (from SecureStore)
 *   2. Device locale (if supported)
 *   3. config.defaultLocale
 */
export async function initI18n(): Promise<Locale> {
  const stored = (await storage.get(LOCALE_KEY)) as Locale | null;
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    i18n.locale = stored;
    return stored;
  }

  const deviceLocales = getLocales();
  const deviceCode = deviceLocales[0]?.languageCode?.toLowerCase();
  const match = deviceCode && (SUPPORTED_LOCALES as readonly string[]).includes(deviceCode)
    ? (deviceCode as Locale)
    : (config.defaultLocale as Locale);

  i18n.locale = match;
  return match;
}

export async function setLocale(locale: Locale): Promise<void> {
  i18n.locale = locale;
  await storage.set(LOCALE_KEY, locale);
}

/** Shortcut matching next-intl's `t('a.b.c')` style. */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
