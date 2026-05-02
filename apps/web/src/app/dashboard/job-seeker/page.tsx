import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';

export default async function JobSeekerDashboardPage() {
  // This app's dashboards are locale-prefixed under `src/app/[locale]/dashboard/*`.
  // Keep this route as a compatibility redirect.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale =
    cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale)
      ? cookieLocale
      : routing.defaultLocale;

  redirect(`/${locale}/dashboard/job-seeker`);
}
