import { config } from './config';

/**
 * Thin fetch wrapper — ported 1:1 from apps/web/src/lib/api.ts.
 * Token is passed explicitly so this module stays side-effect-free and
 * can be safely used from both React components and background tasks.
 */

type FetchOptions = RequestInit & { token?: string };

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error('[API] Non-JSON response:', res.status, text.slice(0, 300));
    throw new Error(`Server returned non-JSON response (HTTP ${res.status})`);
  }
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = opts;
  const res = await fetch(`${config.apiUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });
  return safeJson<T>(res);
}

export const api = {
  get: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  put: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'DELETE', token }),

  upload: async <T>(path: string, formData: FormData, token?: string): Promise<T> => {
    const res = await fetch(`${config.apiUrl}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return safeJson<T>(res);
  },
};
