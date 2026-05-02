import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { getProfileViewers } from '../services/profileView.service';

export async function listProfileViewers(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const isPremium = req.user!.isPremium;
    const result = await getProfileViewers(userId, isPremium);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[profile-views] list error:', err);
    res.status(500).json({ ok: false, error: 'serverError' });
  }
}
