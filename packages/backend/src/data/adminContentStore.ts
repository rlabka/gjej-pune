/**
 * Mock CMS-like content for Super Admin (Design & Content).
 * Text blocks editable in theme panel. No backend.
 */

const STORAGE_KEY = 'admin.content';

export type ContentBlocks = {
  homepageHeadline: string;
  homepageSubtext: string;
  footerAbout: string;
};

const defaults: ContentBlocks = {
  homepageHeadline: 'Find your next opportunity',
  homepageSubtext: 'Connect with employers. Apply in one click.',
  footerAbout: '© Job Matching Platform. All rights reserved.'
};

function load(): ContentBlocks {
  if (typeof window === 'undefined') return { ...defaults };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

let cache: ContentBlocks | null = null;

export function getContentBlocks(): ContentBlocks {
  if (typeof window === 'undefined') return { ...defaults };
  if (!cache) cache = load();
  return { ...cache };
}

export function updateContentBlocks(updates: Partial<ContentBlocks>): void {
  const current = getContentBlocks();
  const next = { ...current, ...updates };
  cache = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}
