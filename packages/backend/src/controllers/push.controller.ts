import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { registerPushToken, unregisterPushToken } from '../services/push.service';

// POST /api/push/register — body: { token: string }
export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const { token } = req.body ?? {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'tokenRequired' });
    }
    await registerPushToken(req.user.id, token);
    return res.json({ ok: true });
  } catch (error: any) {
    if (error?.message === 'invalidToken') {
      return res.status(400).json({ error: 'invalidToken' });
    }
    console.error('Push register error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

// POST /api/push/unregister — body: { token: string }
export async function unregister(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const { token } = req.body ?? {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'tokenRequired' });
    }
    await unregisterPushToken(req.user.id, token);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Push unregister error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}
