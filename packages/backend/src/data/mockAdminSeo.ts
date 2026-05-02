/**
 * Mock SEO config for Super Admin. Meta title/description, sitemap & robots. No backend.
 */

export type SeoConfig = {
  metaTitle: string;
  metaDescription: string;
  sitemapEnabled: boolean;
  robotsContent: string; // content of robots.txt (mock)
};

const STORAGE_KEY = 'admin.seo';

const defaults: SeoConfig = {
  metaTitle: 'Find Your Dream Job | Job Matching Platform',
  metaDescription: 'Connect with top employers. Search jobs, apply in one click, and grow your career.',
  sitemapEnabled: true,
  robotsContent: 'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml'
};

function load(): SeoConfig {
  if (typeof window === 'undefined') return { ...defaults };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<SeoConfig>;
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

let cache: SeoConfig | null = null;

export function getSeoConfig(): SeoConfig {
  if (typeof window === 'undefined') return { ...defaults };
  if (!cache) cache = load();
  return { ...cache };
}

export function updateSeoConfig(updates: Partial<SeoConfig>): void {
  const current = getSeoConfig();
  const next = { ...current, ...updates };
  cache = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

/** Mock sitemap/robots preview (no real file). */
export function getSitemapRobotsPreview(): { sitemap: string; robots: string } {
  const c = getSeoConfig();
  return {
    sitemap: c.sitemapEnabled ? 'https://example.com/sitemap.xml' : '(disabled)',
    robots: c.robotsContent
  };
}
