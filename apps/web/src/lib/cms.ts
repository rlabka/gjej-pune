const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface CmsItem {
  id: string;
  section: string;
  fieldKey: string;
  locale: string;
  value: string;
  type: string;
  updatedAt: string;
}

export interface CmsContentResponse {
  ok: boolean;
  content: CmsItem[];
  grouped: Record<string, Record<string, string>>;
}

/**
 * Fetch all CMS content overrides for a locale.
 */
export async function fetchCmsContent(locale: string): Promise<CmsContentResponse> {
  try {
    const res = await fetch(`${API_URL}/api/cms/content?locale=${locale}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    } as any);
    if (!res.ok) throw new Error(`CMS fetch failed: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('[CMS] fetchCmsContent error:', err);
    return { ok: false, content: [], grouped: {} };
  }
}

/**
 * Fetch CMS content for a specific section.
 */
export async function fetchSectionContent(section: string, locale?: string): Promise<CmsItem[]> {
  try {
    const url = locale
      ? `${API_URL}/api/cms/content/${section}?locale=${locale}`
      : `${API_URL}/api/cms/content/${section}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CMS section fetch failed: ${res.status}`);
    const data = await res.json();
    return data.content || [];
  } catch (err) {
    console.error('[CMS] fetchSectionContent error:', err);
    return [];
  }
}

/**
 * Save CMS content (admin only).
 */
export async function saveCmsContent(
  items: { section: string; fieldKey: string; locale: string; value: string; type?: string }[],
  token: string
): Promise<{ ok: boolean; results?: any[] }> {
  try {
    const res = await fetch(`${API_URL}/api/cms/content`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
    return res.json();
  } catch (err) {
    console.error('[CMS] saveCmsContent error:', err);
    return { ok: false };
  }
}

/**
 * Delete all overrides for a section (admin only).
 */
export async function deleteSectionOverrides(
  section: string,
  token: string,
  locale?: string
): Promise<{ ok: boolean }> {
  try {
    const url = locale
      ? `${API_URL}/api/cms/content/${section}?locale=${locale}`
      : `${API_URL}/api/cms/content/${section}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  } catch (err) {
    console.error('[CMS] deleteSectionOverrides error:', err);
    return { ok: false };
  }
}

/**
 * Upload an image (admin only).
 */
export async function uploadCmsImage(file: File, token: string): Promise<{ ok: boolean; url?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/cms/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return res.json();
  } catch (err) {
    console.error('[CMS] uploadCmsImage error:', err);
    return { ok: false };
  }
}

/**
 * Merge CMS overrides into i18n messages.
 * Takes the standard messages object and CMS grouped data,
 * returns a new messages object with overrides applied.
 */
export function mergeCmsOverrides(
  messages: Record<string, any>,
  cmsGrouped: Record<string, Record<string, string>>
): Record<string, any> {
  const merged = JSON.parse(JSON.stringify(messages)); // deep clone

  for (const [section, fields] of Object.entries(cmsGrouped)) {
    if (!merged[section]) merged[section] = {};
    for (const [fieldKey, value] of Object.entries(fields)) {
      // Support nested keys like "review1_name" → stays flat in section
      merged[section][fieldKey] = value;
    }
  }

  return merged;
}
