import { prisma } from '../config/prisma';
import { createNotification } from './notification.service';

// ─── Localized push texts ───────────────────────────────
const PROFILE_VIEW_PUSH = {
  de: {
    title: 'Profilbesuch',
    bodyJob: (n: string) => `${n} hat dein Stellenangebot angesehen.`,
    bodyAd: (n: string) => `${n} hat dein Profil angesehen.`,
    bodyLockedJob: 'Jemand hat dein Stellenangebot angesehen. 🔒 Premium freischalten.',
    bodyLockedAd: 'Jemand hat dein Profil angesehen. 🔒 Premium freischalten.',
  },
  en: {
    title: 'Profile View',
    bodyJob: (n: string) => `${n} viewed your job listing.`,
    bodyAd: (n: string) => `${n} viewed your profile.`,
    bodyLockedJob: 'Someone viewed your job listing. 🔒 Unlock Premium.',
    bodyLockedAd: 'Someone viewed your profile. 🔒 Unlock Premium.',
  },
  fr: {
    title: 'Visite de profil',
    bodyJob: (n: string) => `${n} a consulté votre offre d'emploi.`,
    bodyAd: (n: string) => `${n} a consulté votre profil.`,
    bodyLockedJob: "Quelqu'un a consulté votre offre. 🔒 Débloquez Premium.",
    bodyLockedAd: "Quelqu'un a consulté votre profil. 🔒 Débloquez Premium.",
  },
  it: {
    title: 'Visita al profilo',
    bodyJob: (n: string) => `${n} ha visualizzato il tuo annuncio di lavoro.`,
    bodyAd: (n: string) => `${n} ha visualizzato il tuo profilo.`,
    bodyLockedJob: 'Qualcuno ha visualizzato il tuo annuncio. 🔒 Sblocca Premium.',
    bodyLockedAd: 'Qualcuno ha visualizzato il tuo profilo. 🔒 Sblocca Premium.',
  },
  sq: {
    title: 'Vizitë profili',
    bodyJob: (n: string) => `${n} ka parë njoftimin e punës tënd.`,
    bodyAd: (n: string) => `${n} ka parë profilin tënd.`,
    bodyLockedJob: 'Dikush ka parë njoftimin e punës tënd. 🔒 Aktivizo Premium.',
    bodyLockedAd: 'Dikush ka parë profilin tënd. 🔒 Aktivizo Premium.',
  },
} as const;

type SupportedLocale = keyof typeof PROFILE_VIEW_PUSH;

// ─── Record a profile view ──────────────────────────────
export async function recordProfileView(
  viewerId: string,
  viewedId: string,
  targetType: 'job' | 'ad',
  targetId: string
) {
  // Don't record if user views their own content
  if (viewerId === viewedId) return null;

  try {
    const pv = await prisma.profileView.create({
      data: { viewerId, viewedId, targetType, targetId },
    });

    // Get viewer info for notification
    const viewer = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { displayName: true, role: true },
    });
    const viewerName = viewer?.displayName || '?';

    // Create notification for the owner
    await createNotification(
      viewedId,
      'profile_view',
      'profile_view',
      '',
      { viewerId, viewerName, targetType, targetId }
    );

    // Send push notification to the owner's mobile devices.
    // Body respects premium-gating: non-premium users only see "someone viewed
    // your X" with a lock emoji, matching the in-app /profile-views screen.
    (async () => {
      try {
        const owner = await prisma.user.findUnique({
          where: { id: viewedId },
          select: { isPremium: true, role: true, locale: true, pushTokens: true },
        });
        if (!owner || !owner.pushTokens || owner.pushTokens === '[]') return;

        const locale = (
          ['de', 'en', 'fr', 'it', 'sq'] as const
        ).includes(owner.locale as SupportedLocale)
          ? (owner.locale as SupportedLocale)
          : 'de';
        const t = PROFILE_VIEW_PUSH[locale];

        // Job-seekers always see the viewer's name (they have no paid subscription).
        // Only employers see the masked "locked" body when not premium.
        const unlocked = owner.role === 'job-seeker' || owner.isPremium;
        const body = unlocked
          ? targetType === 'job'
            ? t.bodyJob(viewerName)
            : t.bodyAd(viewerName)
          : targetType === 'job'
            ? t.bodyLockedJob
            : t.bodyLockedAd;

        const { sendPushToUser } = await import('./push.service');
        await sendPushToUser(viewedId, t.title, body, {
          type: 'profile_view',
          targetType,
          targetId,
        });
      } catch (err) {
        console.error('[ProfileView] push failed:', err);
      }
    })();

    return pv;
  } catch {
    // unique constraint → already viewed
    return null;
  }
}

// ─── Get viewers of my content (for premium users) ──────
export async function getProfileViewers(userId: string, isPremium: boolean) {
  const views = await prisma.profileView.findMany({
    where: { viewedId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (!isPremium) {
    // Non-premium: return count only, no details
    return { count: views.length, viewers: [], locked: true };
  }

  // Premium: enrich with viewer info
  const enriched = await Promise.all(
    views.map(async (v: any) => {
      const viewer = await prisma.user.findUnique({
        where: { id: v.viewerId },
        select: { id: true, displayName: true, image: true, role: true },
      });
      return {
        id: v.id,
        viewerId: v.viewerId,
        viewerName: viewer?.displayName || 'Unbekannt',
        viewerImage: viewer?.image || null,
        viewerRole: viewer?.role || 'job-seeker',
        targetType: v.targetType,
        targetId: v.targetId,
        createdAt: v.createdAt,
      };
    })
  );

  return { count: views.length, viewers: enriched, locked: false };
}
