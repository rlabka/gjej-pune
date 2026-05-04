import { prisma } from '../config/prisma';
import { createNotification } from './notification.service';
import { sendPushToUser } from './push.service';

type SupportedLocale = 'de' | 'en' | 'fr' | 'it' | 'sq';

const NEW_MATCH_PUSH: Record<
  SupportedLocale,
  {
    title: string;
    bodyForJob: (category: string) => string;
    bodyForAd: (category: string) => string;
  }
> = {
  de: {
    title: 'Neuer passender Treffer',
    bodyForJob: (cat) => `Ein neuer Kandidat passt zu deinem Job: ${cat}`,
    bodyForAd: (cat) => `Eine neue Stelle passt zu deinem Profil: ${cat}`,
  },
  en: {
    title: 'New matching result',
    bodyForJob: (cat) => `A new candidate matches your job: ${cat}`,
    bodyForAd: (cat) => `A new job matches your profile: ${cat}`,
  },
  fr: {
    title: 'Nouveau résultat correspondant',
    bodyForJob: (cat) => `Un nouveau candidat correspond à votre offre : ${cat}`,
    bodyForAd: (cat) => `Un nouveau poste correspond à votre profil : ${cat}`,
  },
  it: {
    title: 'Nuovo abbinamento',
    bodyForJob: (cat) => `Un nuovo candidato corrisponde al tuo annuncio: ${cat}`,
    bodyForAd: (cat) => `Un nuovo lavoro corrisponde al tuo profilo: ${cat}`,
  },
  sq: {
    title: 'Përputhje e re',
    bodyForJob: (cat) => `Një kandidat i ri përputhet me punën tënde: ${cat}`,
    bodyForAd: (cat) => `Një punë e re përputhet me profilin tënd: ${cat}`,
  },
};

const MAX_RECIPIENTS = 25;

function pickLocale(loc: string | null | undefined): SupportedLocale {
  return (['de', 'en', 'fr', 'it', 'sq'] as const).includes(loc as SupportedLocale)
    ? (loc as SupportedLocale)
    : 'de';
}

/**
 * A new job-seeker ad was created. Find active employer jobs with the same
 * category and notify each owner that a new matching candidate appeared.
 *
 * Self-notifications are skipped (in case an employer also has an ad in the
 * same category). Capped at MAX_RECIPIENTS to avoid notification storms when
 * a popular category gets a new ad.
 */
export async function notifyEmployersOfNewAd(ad: {
  id: string;
  userId: string;
  category: string;
}): Promise<void> {
  if (!ad.category) return;
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'Active', category: ad.category, NOT: { userId: ad.userId } },
      select: { id: true, userId: true, category: true },
      take: MAX_RECIPIENTS,
    });
    if (jobs.length === 0) return;

    // Dedupe by userId — an employer with multiple jobs in the same category
    // should only get one push.
    const ownerIds: string[] = Array.from(new Set(jobs.map((j: { userId: string }) => j.userId)));
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, locale: true },
    });
    const localeByUser = new Map<string, SupportedLocale>(
      owners.map((u: { id: string; locale: string | null }) => [u.id, pickLocale(u.locale)] as [string, SupportedLocale])
    );

    for (const ownerId of ownerIds) {
      const loc = localeByUser.get(ownerId) ?? 'de';
      const t = NEW_MATCH_PUSH[loc];
      const body = t.bodyForJob(ad.category);

      // In-app notification (always created — appears in /notifications inbox)
      createNotification(
        ownerId,
        'new_match',
        t.title,
        body,
        { adId: ad.id, category: ad.category, direction: 'ad-for-job' }
      ).catch(() => {});

      // Push (best-effort, fire-and-forget)
      sendPushToUser(ownerId, t.title, body, {
        type: 'new_match',
        targetType: 'ad',
        targetId: ad.id,
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[matchNotify] notifyEmployersOfNewAd failed:', err);
  }
}

/**
 * A new employer job was created. Find active job-seeker ads with the same
 * category and notify each owner that a new matching job appeared.
 */
export async function notifyJobSeekersOfNewJob(job: {
  id: string;
  userId: string;
  category: string;
}): Promise<void> {
  if (!job.category) return;
  try {
    const ads = await prisma.jobSeekerAd.findMany({
      where: { status: 'Active', category: job.category, NOT: { userId: job.userId } },
      select: { id: true, userId: true, category: true },
      take: MAX_RECIPIENTS,
    });
    if (ads.length === 0) return;

    const ownerIds: string[] = Array.from(new Set(ads.map((a: { userId: string }) => a.userId)));
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, locale: true },
    });
    const localeByUser = new Map<string, SupportedLocale>(
      owners.map((u: { id: string; locale: string | null }) => [u.id, pickLocale(u.locale)] as [string, SupportedLocale])
    );

    for (const ownerId of ownerIds) {
      const loc = localeByUser.get(ownerId) ?? 'de';
      const t = NEW_MATCH_PUSH[loc];
      const body = t.bodyForAd(job.category);

      createNotification(
        ownerId,
        'new_match',
        t.title,
        body,
        { jobId: job.id, category: job.category, direction: 'job-for-ad' }
      ).catch(() => {});

      sendPushToUser(ownerId, t.title, body, {
        type: 'new_match',
        targetType: 'job',
        targetId: job.id,
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[matchNotify] notifyJobSeekersOfNewJob failed:', err);
  }
}
