'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const cta = {
  de: { question: 'Möchtest du, dass dein Logo hier steht?', link: 'Jetzt werben' },
  en: { question: 'Want your logo here?', link: 'Advertise now' },
  fr: { question: 'Vous voulez votre logo ici ?', link: 'Faire de la publicité' },
  it: { question: 'Vuoi il tuo logo qui?', link: 'Pubblicizza ora' },
  sq: { question: 'Dëshironi logon tuaj këtu?', link: 'Reklamoni tani' },
} as const;

interface AdLogo {
  id: string;
  companyName: string;
  companyWebsite: string | null;
  logoUrl: string | null;
}

export default function TrustLogos() {
  const t = useTranslations('Trust');
  const locale = useLocale() as keyof typeof cta;
  const c = cta[locale] ?? cta.de;

  const [apiLogos, setApiLogos] = useState<AdLogo[]>([]);

  // Fetch active ad placements
  useEffect(() => {
    fetch(`${API_URL}/api/ad-placements/active`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.ads) setApiLogos(data.ads);
      })
      .catch(() => {});
  }, []);

  // Collect CMS logos (translation-based)
  const cmsLogos: string[] = [];
  for (let i = 1; i <= 80; i++) {
    const key = `logo${i}`;
    if (!t.has(key)) break;
    const url = t(key);
    if (url && !url.startsWith('Trust.logo')) cmsLogos.push(url);
  }

  // Build combined logo list: API ads first, then CMS logos
  type LogoItem = { url: string; name: string; website: string | null };
  const allLogos: LogoItem[] = [];

  // Add API ad placements
  for (const ad of apiLogos) {
    if (ad.logoUrl) {
      allLogos.push({
        url: ad.logoUrl.startsWith('/uploads/') ? `${API_URL}${ad.logoUrl}` : ad.logoUrl,
        name: ad.companyName,
        website: ad.companyWebsite,
      });
    }
  }

  // Add CMS logos
  for (const url of cmsLogos) {
    allLogos.push({
      url: url.startsWith('/uploads/') ? `${API_URL}${url}` : url,
      name: 'Partner',
      website: null,
    });
  }

  // Fallback
  if (allLogos.length === 0) {
    allLogos.push({ url: '/magentix-logo.png', name: 'Partner', website: null });
  }

  const logoCount = allLogos.length;
  const marqueeLogos = [...allLogos, ...allLogos];
  const duration = Math.max(20, Math.min(logoCount * 4, 120));

  return (
    <section className="py-8 sm:py-10 lg:py-14 bg-white border-y border-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[12px] sm:text-[14px] font-bold text-[#162C66]/30 uppercase tracking-[0.3em] mb-6 sm:mb-10">
          {t('title')}
        </p>

        <div className="trust-marquee-wrap relative overflow-hidden mb-10 sm:mb-14">
          <div className="trust-marquee flex items-center">
            {marqueeLogos.map((logo, i) => {
              const img = (
                <img
                  key={i}
                  src={logo.url}
                  alt={logo.name}
                  loading="lazy"
                  className="h-10 sm:h-14 md:h-16 w-auto object-contain shrink-0 mx-6 sm:mx-10 md:mx-14 opacity-30 grayscale hover:grayscale-0 hover:opacity-60 transition-all duration-500"
                />
              );
              if (logo.website) {
                return (
                  <a key={i} href={logo.website} target="_blank" rel="noopener noreferrer" title={logo.name}>
                    {img}
                  </a>
                );
              }
              return img;
            })}
          </div>
        </div>

        <p className="text-center text-[13px] sm:text-[15px] text-slate-500 font-medium">
          {c.question}{' '}
          <Link href="/advertise" className="text-[#162C66] font-bold hover:underline hover:text-blue-700 transition-colors">
            {c.link}
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes trustScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .trust-marquee {
          width: max-content;
          animation: trustScroll ${duration}s linear infinite;
          will-change: transform;
        }
        .trust-marquee:hover {
          animation-play-state: paused;
        }
        .trust-marquee-wrap::before,
        .trust-marquee-wrap::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }
        .trust-marquee-wrap::before {
          left: 0;
          background: linear-gradient(to right, white, transparent);
        }
        .trust-marquee-wrap::after {
          right: 0;
          background: linear-gradient(to left, white, transparent);
        }
      `}</style>
    </section>
  );
}
