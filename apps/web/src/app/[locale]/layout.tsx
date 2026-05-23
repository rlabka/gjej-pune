import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import ThemeProvider from '@/components/ThemeProvider';
import AppDownloadBanner from '@/components/AppDownloadBanner';

const CMS_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchCmsOverrides(locale: string): Promise<Record<string, Record<string, string>>> {
  try {
    const res = await fetch(`${CMS_API}/api/cms/content?locale=${locale}`, {
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.ok ? (data.grouped || {}) : {};
  } catch {
    return {};
  }
}

function mergeCmsIntoMessages(
  messages: Record<string, any>,
  overrides: Record<string, Record<string, string>>
): Record<string, any> {
  if (!overrides || Object.keys(overrides).length === 0) return messages;
  const merged = JSON.parse(JSON.stringify(messages));
  for (const [section, fields] of Object.entries(overrides)) {
    if (!merged[section]) merged[section] = {};
    for (const [key, value] of Object.entries(fields)) {
      merged[section][key] = value;
    }
  }
  return merged;
}

type AppLocale = (typeof routing.locales)[number];

function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gjej-pune.com';

  const perLocale: Record<string, { title: string; description: string }> = {
    de: {
      title: 'Jobs in Europa – gjej-pune.com',
      description: 'Finde Jobs und Talente in Albanien, Kosovo und ganz Europa – einfach, schnell und sicher.'
    },
    en: {
      title: 'Jobs in Europe – gjej-pune.com',
      description: 'Find jobs and talent in Albania, Kosovo and across Europe — simple, fast, and trusted.'
    },
    fr: {
      title: 'Emplois en Europe – gjej-pune.com',
      description: "Trouvez des emplois et des talents en Albanie, au Kosovo et dans toute l'Europe — simple, rapide et fiable."
    },
    it: {
      title: 'Lavoro in Europa – gjej-pune.com',
      description: 'Trova lavoro e talenti in Europa — semplice, veloce e affidabile.'
    },
    sq: {
      title: 'Punë në Evropë – gjej-pune.com',
      description: 'Gjej punë dhe talente në Shqipëri, Kosovë dhe në gjithë Evropën — thjesht, shpejt dhe me besim.'
    }
  };

  const { title, description } = perLocale[locale] || perLocale.de;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: `%s – gjej-pune.com`
    },
    description,
    openGraph: {
      type: 'website',
      url: `/${locale}`,
      title,
      description,
      siteName: 'gjej-pune.com'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    alternates: {
      languages: {
        de: '/de',
        en: '/en',
        fr: '/fr',
        it: '/it',
        sq: '/sq'
      }
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!isAppLocale(locale)) {
    notFound();
  }

  // Load default i18n messages + CMS overrides
  const [messages, cmsOverrides] = await Promise.all([
    getMessages(),
    fetchCmsOverrides(locale),
  ]);
  const mergedMessages = mergeCmsIntoMessages(messages as Record<string, any>, cmsOverrides);

  return (
    <NextIntlClientProvider messages={mergedMessages}>
      <ThemeProvider>
        <AppDownloadBanner />
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
