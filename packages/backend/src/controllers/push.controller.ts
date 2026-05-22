import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  registerPushToken,
  unregisterPushToken,
  previewBroadcastAudience,
  broadcastPush,
  type BroadcastFilter,
} from '../services/push.service';
import { prisma } from '../config/prisma';

const VALID_ROLES = new Set(['job-seeker', 'employer']);
const VALID_LOCALES = new Set(['de', 'en', 'fr', 'it', 'sq']);

// Per Apple/Google notification UX guidelines — keep payloads short.
const MAX_TITLE = 65;
const MAX_BODY = 240;

function parseFilter(raw: unknown): { ok: true; filter: BroadcastFilter } | { ok: false; error: string } {
  const f = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const filter: BroadcastFilter = {};
  if (f.role !== undefined && f.role !== null && f.role !== '') {
    if (typeof f.role !== 'string' || !VALID_ROLES.has(f.role)) {
      return { ok: false, error: 'invalidRole' };
    }
    filter.role = f.role as BroadcastFilter['role'];
  }
  if (f.isPremium !== undefined && f.isPremium !== null && f.isPremium !== '') {
    if (typeof f.isPremium !== 'boolean') {
      return { ok: false, error: 'invalidIsPremium' };
    }
    filter.isPremium = f.isPremium;
  }
  if (f.locale !== undefined && f.locale !== null && f.locale !== '') {
    if (typeof f.locale !== 'string' || !VALID_LOCALES.has(f.locale)) {
      return { ok: false, error: 'invalidLocale' };
    }
    filter.locale = f.locale;
  }
  if (f.countryCode !== undefined && f.countryCode !== null && f.countryCode !== '') {
    if (typeof f.countryCode !== 'string' || !/^[A-Z]{2}$/.test(f.countryCode)) {
      return { ok: false, error: 'invalidCountryCode' };
    }
    filter.countryCode = f.countryCode;
  }
  return { ok: true, filter };
}

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

// POST /api/admin/push/preview — admin-only audience count for a filter.
// Body: { filter?: BroadcastFilter }
export async function adminPushPreview(req: AuthenticatedRequest, res: Response) {
  try {
    const parsed = parseFilter(req.body?.filter);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    const result = await previewBroadcastAudience(parsed.filter);
    return res.json({ ok: true, ...result, filter: parsed.filter });
  } catch (error) {
    console.error('Push preview error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

// POST /api/admin/push/broadcast — send to all matching users.
// Body: { filter?: BroadcastFilter, title: string, body: string, data?: object }
export async function adminPushBroadcast(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const parsed = parseFilter(req.body?.filter);
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });

    const { title, body, data } = req.body ?? {};
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'titleRequired' });
    }
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({ error: 'bodyRequired' });
    }
    if (title.length > MAX_TITLE) {
      return res.status(400).json({ error: 'titleTooLong', max: MAX_TITLE });
    }
    if (body.length > MAX_BODY) {
      return res.status(400).json({ error: 'bodyTooLong', max: MAX_BODY });
    }
    const safeData = data && typeof data === 'object' && !Array.isArray(data) ? data : {};

    const result = await broadcastPush(parsed.filter, title.trim(), body.trim(), safeData);

    // Audit log — succeeds or fails silently; we'd rather deliver than block on logging.
    try {
      await prisma.pushBroadcast.create({
        data: {
          adminId: req.user.id,
          filter: parsed.filter as never,
          title: title.trim(),
          body: body.trim(),
          data: safeData as never,
          usersTargeted: result.users,
          devicesTargeted: result.devices,
          devicesSent: result.sent,
          devicesFailed: result.failed,
        },
      });
    } catch (auditErr) {
      console.error('[Push] audit log failed (delivery still completed):', auditErr);
    }

    return res.json({ ok: true, ...result, filter: parsed.filter });
  } catch (error) {
    console.error('Push broadcast error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

// GET /api/admin/push/history?limit=20
export async function adminPushHistory(_req: AuthenticatedRequest, res: Response) {
  try {
    const items = await prisma.pushBroadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { admin: { select: { id: true, email: true, displayName: true } } },
    });
    return res.json({ ok: true, items });
  } catch (error) {
    console.error('Push history error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}
