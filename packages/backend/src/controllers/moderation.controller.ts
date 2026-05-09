import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  blockUser,
  unblockUser,
  listBlockedUsers,
  createReport,
} from '../services/moderation.service';

/**
 * POST /api/users/:id/block
 * Body: {} — no payload needed.
 */
export async function blockUserHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const blockerId = req.user?.id;
    if (!blockerId) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const blockedId = req.params.id;
    if (!blockedId) return res.status(400).json({ ok: false, error: 'missingId' });

    const result = await blockUser(blockerId, blockedId);
    if (!result.ok) {
      const status = result.code === 'userNotFound' ? 404 : 400;
      return res.status(status).json({ ok: false, error: result.code });
    }
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('[Moderation] block error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/users/:id/block
 */
export async function unblockUserHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const blockerId = req.user?.id;
    if (!blockerId) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const blockedId = req.params.id;
    if (!blockedId) return res.status(400).json({ ok: false, error: 'missingId' });

    await unblockUser(blockerId, blockedId);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('[Moderation] unblock error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * GET /api/users/blocked
 */
export async function listBlockedHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const blocked = await listBlockedUsers(userId);
    return res.json({ ok: true, blocked });
  } catch (err: any) {
    console.error('[Moderation] list blocked error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/reports
 * Body: { targetType: "user" | "message" | "job" | "ad", targetId: string,
 *         reason: string, details?: string }
 */
export async function createReportHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const { targetType, targetId, reason, details } = req.body || {};
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ ok: false, error: 'missingFields' });
    }

    const result = await createReport({
      reporterId,
      targetType,
      targetId,
      reason,
      details: typeof details === 'string' ? details : null,
    });
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.code });
    }
    return res.status(201).json({ ok: true, id: result.id });
  } catch (err: any) {
    console.error('[Moderation] report error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}
