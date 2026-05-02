import { prisma } from '../config/prisma';

export async function toggleFavorite(userId: string, targetType: 'job' | 'ad', targetId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  await prisma.favorite.create({ data: { userId, targetType, targetId } });
  return { favorited: true };
}

export async function getUserFavorites(userId: string, targetType?: 'job' | 'ad') {
  const where: any = { userId };
  if (targetType) where.targetType = targetType;

  const favorites = await prisma.favorite.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return favorites;
}

export async function getUserFavoriteIds(userId: string, targetType: 'job' | 'ad') {
  const favorites = await prisma.favorite.findMany({
    where: { userId, targetType },
    select: { targetId: true },
  });
  return favorites.map((f) => f.targetId);
}

export async function isFavorited(userId: string, targetType: 'job' | 'ad', targetId: string) {
  const fav = await prisma.favorite.findUnique({
    where: { userId_targetType_targetId: { userId, targetType, targetId } },
  });
  return !!fav;
}

export async function getSavedJobsWithDetails(userId: string) {
  const favoriteIds = await getUserFavoriteIds(userId, 'job');
  if (favoriteIds.length === 0) return [];

  const jobs = await prisma.job.findMany({
    where: { id: { in: favoriteIds } },
    include: { images: true, user: { select: { displayName: true } } },
  });

  // Preserve favorites order (newest saved first)
  const jobMap = new Map(jobs.map((j) => [j.id, j]));
  return favoriteIds.map((id) => jobMap.get(id)).filter(Boolean);
}

export async function getSavedAdsWithDetails(userId: string) {
  const favoriteIds = await getUserFavoriteIds(userId, 'ad');
  if (favoriteIds.length === 0) return [];

  const ads = await prisma.jobSeekerAd.findMany({
    where: { id: { in: favoriteIds } },
    include: { user: { select: { displayName: true } } },
  });

  // Preserve favorites order (newest saved first)
  const adMap = new Map(ads.map((a) => [a.id, a]));
  return favoriteIds.map((id) => adMap.get(id)).filter(Boolean);
}

export async function trackShare(targetType: 'job' | 'ad', targetId: string) {
  if (targetType === 'job') {
    await prisma.job.update({ where: { id: targetId }, data: { shares: { increment: 1 } } });
  } else {
    await prisma.jobSeekerAd.update({ where: { id: targetId }, data: { shares: { increment: 1 } } });
  }
  return { shared: true };
}
