const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Resolves an image URL — prepends the backend API URL for /uploads/ paths
 * so that CMS-uploaded images load correctly from the backend server.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
  return url;
}
