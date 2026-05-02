import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notification.service';

/**
 * Strip premium-only fields from notification meta when the recipient is not
 * a premium user. Mirrors the gating done in /api/profile-views and the
 * messaging endpoints — without this, non-premium employers could see viewer
 * names directly via the inbox even though /profile-views hides them.
 */
function maskNotificationForNonPremium(notification: any) {
  if (notification.type !== 'profile_view') return notification;
  let meta: Record<string, unknown> = {};
  try {
    meta = notification.meta ? JSON.parse(notification.meta) : {};
  } catch {
    meta = {};
  }
  const masked = {
    ...meta,
    viewerName: undefined,
    viewerId: undefined,
    viewerImage: undefined,
  };
  return {
    ...notification,
    body: '',
    meta: JSON.stringify(masked),
  };
}

export async function listNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const isPremium = !!req.user!.isPremium;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 15;
    const { notifications, nextCursor } = await getNotifications(userId, limit, cursor);

    const filtered = isPremium
      ? notifications
      : notifications.map(maskNotificationForNonPremium);

    res.json({ ok: true, notifications: filtered, nextCursor });
  } catch (err) {
    console.error('[notifications] list error:', err);
    res.status(500).json({ ok: false, error: 'serverError' });
  }
}

export async function unreadCount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const count = await getUnreadCount(userId);
    res.json({ ok: true, count });
  } catch (err) {
    console.error('[notifications] unread-count error:', err);
    res.status(500).json({ ok: false, error: 'serverError' });
  }
}

export async function markRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    await markAsRead(id, userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[notifications] mark-read error:', err);
    res.status(500).json({ ok: false, error: 'serverError' });
  }
}

export async function markAllRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    await markAllAsRead(userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[notifications] mark-all-read error:', err);
    res.status(500).json({ ok: false, error: 'serverError' });
  }
}
