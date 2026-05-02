import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { toggleFavorite, getUserFavoriteIds, getSavedJobsWithDetails, getSavedAdsWithDetails, trackShare } from '../services/favorite.service';

export async function toggle(req: AuthenticatedRequest, res: Response) {
  try {
    const { targetType, targetId } = req.body;
    if (!targetType || !targetId || !['job', 'ad'].includes(targetType)) {
      return res.status(400).json({ error: 'invalidParams' });
    }
    const result = await toggleFavorite(req.user!.id, targetType, targetId);
    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function listIds(req: AuthenticatedRequest, res: Response) {
  try {
    const targetType = req.query.targetType as 'job' | 'ad' | undefined;
    if (targetType && !['job', 'ad'].includes(targetType)) {
      return res.status(400).json({ error: 'invalidParams' });
    }
    const jobIds = await getUserFavoriteIds(req.user!.id, 'job');
    const adIds = await getUserFavoriteIds(req.user!.id, 'ad');
    return res.json({ ok: true, jobIds, adIds });
  } catch (error) {
    console.error('List favorites error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function savedJobs(req: AuthenticatedRequest, res: Response) {
  try {
    const jobs = await getSavedJobsWithDetails(req.user!.id);
    return res.json({ ok: true, jobs });
  } catch (error) {
    console.error('Saved jobs error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function savedAds(req: AuthenticatedRequest, res: Response) {
  try {
    const ads = await getSavedAdsWithDetails(req.user!.id);
    return res.json({ ok: true, ads });
  } catch (error) {
    console.error('Saved ads error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function share(req: AuthenticatedRequest, res: Response) {
  try {
    const { targetType, targetId } = req.body;
    if (!targetType || !targetId || !['job', 'ad'].includes(targetType)) {
      return res.status(400).json({ error: 'invalidParams' });
    }
    await trackShare(targetType, targetId);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Track share error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}
