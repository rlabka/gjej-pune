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

/**
 * Resolve a job-title key to the parent category group's localized label
 * (e.g. title "Grafikdesign" → category "Design & Werbung").
 * Mirrors apps/web/src/hooks/useCategories.ts → getCategoryLabelForTitle().
 */
export function getCategoryLabelForTitle(
  key: string | null | undefined,
  locale: Locale
): string {
  if (!key) return '';
  for (const cat of JOB_CATEGORIES) {
    if (cat.titles.some((t) => t.key === key)) {
      return cat.labels[locale] ?? cat.labels.sq ?? '';
    }
  }
  return '';
}
