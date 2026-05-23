'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { X } from 'lucide-react';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import Image from 'next/image';

const APP_STORE_URL = 'https://apps.apple.com/app/id6765750376';
const PLAY_STORE_URL = '#'; // Placeholder until the Android build ships.

const DISMISS_KEY = 'gjp:app-banner-dismissed';
const DISMISS_TTL_DAYS = 7;

const COPY = {
  de: { title: 'gjej-pune App', subtitle: 'Im App Store laden', open: 'Öffnen', close: 'Schließen' },
  en: { title: 'gjej-pune App', subtitle: 'Open in the App Store', open: 'Open', close: 'Close' },
  fr: { title: 'App gjej-pune', subtitle: 'Ouvrir dans App Store', open: 'Ouvrir', close: 'Fermer' },
  it: { title: 'App gjej-pune', subtitle: 'Apri nell\'App Store', open: 'Apri', close: 'Chiudi' },
  sq: { title: 'Aplikacioni gjej-pune', subtitle: 'Hap në App Store', open: 'Hap', close: 'Mbyll' },
} as const;

type Platform = 'ios' | 'android' | null;

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPod|iPad/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return null;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // Already inside a PWA / home-screen install → no banner.
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function wasRecentlyDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const v = localStorage.getItem(DISMISS_KEY);
    if (!v) return false;
    const ts = parseInt(v, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * Slim top-bar banner — mounted globally, only visible on mobile browsers,
 * dismissible (remembered for 7 days). iOS users get the App Store CTA;
 * Android currently falls through to no CTA because the Play Store URL
 * isn't live yet.
 */
export default function AppDownloadBanner() {
  const locale = useLocale() as keyof typeof COPY;
  const l = COPY[locale] ?? COPY.de;

  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (wasRecentlyDismissed()) return;
    const p = detectPlatform();
    setPlatform(p);
    if (p === 'ios' && APP_STORE_URL) setVisible(true);
    else if (p === 'android' && PLAY_STORE_URL) setVisible(true);
  }, []);

  function handleDismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* user blocked storage */
    }
  }

  if (!visible) return null;
  const url = platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  if (!url) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-[#162C66] text-white border-b border-white/10 lg:hidden">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={handleDismiss}
          aria-label={l.close}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5C400]">
          <Image
            src="/apple-touch-icon.png"
            alt=""
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-tight">{l.title}</p>
          <p className="truncate text-[11px] text-white/60">{l.subtitle}</p>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#F5C400] px-3.5 py-1.5 text-[12px] font-extrabold text-[#162C66] hover:bg-[#E6B800] transition-colors"
        >
          {platform === 'ios' ? <FaApple size={14} /> : <FaGooglePlay size={12} />}
          <span>{l.open}</span>
        </a>
      </div>
    </div>
  );
}
