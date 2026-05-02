import Header from '@/components/Header';
import Footer from '@/components/Footer';

const SSR_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getLegalContent(fieldKey: string, locale: string): Promise<string> {
  try {
    const res = await fetch(`${SSR_API_URL}/api/cms/content/Legal?locale=${locale}`, {
      cache: 'no-store',
    });
    if (!res.ok) return '';
    const data = await res.json();
    if (!data.ok) return '';
    const item = data.content?.find((c: any) => c.fieldKey === fieldKey);
    return item?.value || '';
  } catch (err) {
    console.error('[Impressum] Failed to fetch legal content:', err);
    return '';
  }
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const content = await getLegalContent('impressum', locale);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <h1 className="text-3xl lg:text-4xl font-black text-[#162C66] mb-8">Impressum</h1>
          {content ? (
            <div
              className="max-w-none text-slate-600 text-base leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#162C66] [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#162C66] [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1.5 [&_a]:text-[#162C66] [&_a]:underline [&_strong]:font-bold [&_strong]:text-[#162C66]"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-slate-400 italic">Noch kein Inhalt vorhanden.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
