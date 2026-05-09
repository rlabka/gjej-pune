import { Request, Response } from 'express';
import { createAd, getAdsByUser, getAds, getAdById, updateAd, deleteAd, getAdCategories, updateAdPhoto } from '../services/jobAd.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordProfileView } from '../services/profileView.service';
import { createNotification } from '../services/notification.service';
import { notifyEmployersOfNewAd } from '../services/matchNotify.service';
import { getHiddenUserIds } from '../services/moderation.service';

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const ad = await createAd({ ...req.body, userId: req.user.id });

    // Notify: ad is now online
    createNotification(
      req.user.id, 'ad_online',
      'ad_online',
      '',
      { adTitle: (ad as any).title || (ad as any).category || '', targetType: 'ad', targetId: (ad as any).id }
    ).catch(() => {});

    // Push to employers whose jobs match this new ad (fire-and-forget)
    notifyEmployersOfNewAd({
      id: (ad as any).id,
      userId: req.user.id,
      category: (ad as any).category,
    }).catch(() => {});

    return res.status(201).json({ ok: true, ad });
  } catch (error) {
    console.error('Create ad error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function myAds(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const ads = await getAdsByUser(req.user.id);
    return res.json({ ok: true, ads });
  } catch (error) {
    console.error('My ads error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const { keyword, category, location, lat, lng, radius, page, limit, sort, experience, availability } = req.query;
    const result = await getAds({
      keyword: keyword as string | undefined,
      category: category as string | undefined,
      location: location as string | undefined,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radius: radius ? Number(radius) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as string | undefined,
      experience: experience as string | undefined,
      availability: availability as string | undefined,
    });
    // App Store Guideline 1.2: filter out ads from blocked users (and from
    // users who blocked the viewer). Authenticated requests only.
    const viewerId = (req as AuthenticatedRequest).user?.id;
    if (viewerId) {
      const hidden = await getHiddenUserIds(viewerId);
      if (hidden.length && Array.isArray((result as any).ads)) {
        (result as any).ads = (result as any).ads.filter(
          (a: any) => !hidden.includes(a.userId)
        );
      }
    }
    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error('List ads error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function categories(_req: Request, res: Response) {
  try {
    const cats = await getAdCategories();
    return res.json({ ok: true, categories: cats });
  } catch (error) {
    console.error('Ad categories error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const viewerId = (req as any).user?.id;
    // First fetch without view tracking to check ownership
    const adCheck = await getAdById(String(req.params.id));
    if (!adCheck) return res.status(404).json({ error: 'notFound' });
    const viewerIsOwner = viewerId && adCheck.userId === viewerId;
    // Only track views for non-owners
    const viewerKey = viewerIsOwner ? undefined : (viewerId || req.ip || 'anonymous');
    const ad = (viewerKey ? await getAdById(String(req.params.id), viewerKey) : adCheck)!;
    // Track profile view if logged in and not owner
    if (viewerId && !viewerIsOwner) {
      recordProfileView(viewerId, ad.userId, 'ad', ad.id).catch(() => {});
    }
    return res.json({ ok: true, ad });
  } catch (error) {
    console.error('Get ad error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const ad = await updateAd(String(req.params.id), req.user.id, req.body);
    if (!ad) return res.status(404).json({ error: 'notFound' });
    return res.json({ ok: true, ad: { ...ad, skills: JSON.parse(ad.skills) } });
  } catch (error) {
    console.error('Update ad error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const ok = await deleteAd(String(req.params.id), req.user.id);
    if (!ok) return res.status(404).json({ error: 'notFound' });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Delete ad error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function uploadPhoto(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'noFile' });
    const photoUrl = `/uploads/ads/${req.file.filename}`;
    const ad = await updateAdPhoto(String(req.params.id), req.user.id, photoUrl);
    if (!ad) return res.status(404).json({ error: 'notFound' });
    return res.json({ ok: true, photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}
