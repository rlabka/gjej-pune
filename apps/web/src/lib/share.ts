/**
 * Share utilities – open real WhatsApp / Facebook links and copy to clipboard.
 */

export function buildShareUrl(type: 'job' | 'ad', id: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const locale = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[1] || 'de'
    : 'de';
  const path = type === 'job' ? 'jobs' : 'candidates';
  return `${origin}/${locale}/${path}?id=${id}`;
}

export function shareWhatsApp(url: string, text?: string) {
  const msg = text ? `${text} ${url}` : url;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

export function shareFacebook(url: string) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

export async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}
