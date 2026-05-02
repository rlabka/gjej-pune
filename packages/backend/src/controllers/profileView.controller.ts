import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getProfileViewers } from '../services/profileView.service';

export async function listProfileViewers(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    // Job-seekers always get full access (they have no paid subscription tier).
    // Only employers see the locked/premium gate.
    const isJobSeeker = req.user!.role === 'job-seeker';
    const unlocked = isJobSeeker || req.user!.isPremium;
    const result = await getProfileViewers(userId, unlocked);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[profile-views] list error:', err);
    res.status(500).json({ ok: false, error: 'serverError' });
  }
}
