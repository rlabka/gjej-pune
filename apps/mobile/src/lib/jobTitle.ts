import { JOB_CATEGORIES, type Locale } from '@jmp/shared';

/**
 * Translate a stored job-title `key` (always the Albanian source string)
 * into the user's locale. Falls back to the Albanian key itself if no
 * translation exists — that way custom or legacy categories still render.
 *
 * Mirrors apps/web/src/hooks/useCategories.ts → getTranslatedTitle().
 */
export function translateJobTitle(key: string | null | undefined, locale: Locale): string {
  if (!key) return '';
  for (const cat of JOB_CATEGORIES) {
    const t = cat.titles.find((ti) => ti.key === key);
    if (t) return t.labels[locale] ?? t.labels.sq ?? key;
  }
  return key;
}
