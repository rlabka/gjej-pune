import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import JobsContent from './JobsContent';
import LoadingScreen from '@/components/ui/LoadingScreen';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const keyword = typeof params?.keyword === 'string' ? params.keyword.trim() : '';
  const location = typeof params?.location === 'string' ? params.location.trim() : '';
  const t = await getTranslations('Jobs');
  const title = keyword
    ? t('pageTitleWithKeyword', { keyword })
    : location
      ? t('pageTitleWithLocation', { location })
      : t('pageTitle');
  const description =
    keyword || location ? t('pageDescriptionSearch') : t('pageDescription');
  return { title, description };
}

export default async function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow bg-[#F0F2F5]">
            <LoadingScreen variant="section" />
          </main>
          <Footer />
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
