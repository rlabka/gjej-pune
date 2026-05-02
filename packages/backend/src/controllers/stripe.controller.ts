import { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  createCheckoutSession,
  getSubscriptionDetails,
  getInvoices,
  cancelSubscription,
  reactivateSubscription,
  createBillingPortalSession,
  handleWebhookEvent,
  getPlans,
} from '../services/stripe.service';

/**
 * POST /api/stripe/checkout
 * Body: { planIndex: number, locale?: string }
 */
export async function checkout(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { planId, locale } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId required' });
    }

    const result = await createCheckoutSession(userId, planId, locale || 'de');
    return res.json({ ok: true, url: result.url });
  } catch (err: any) {
    console.error('[Stripe] Checkout error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'checkout_failed' });
  }
}

/**
 * GET /api/stripe/subscription
 */
export async function subscription(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const details = await getSubscriptionDetails(userId);
    return res.json({ ok: true, subscription: details });
  } catch (err: any) {
    console.error('[Stripe] Subscription details error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * GET /api/stripe/invoices
 */
export async function invoices(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const list = await getInvoices(userId);
    return res.json({ ok: true, invoices: list });
  } catch (err: any) {
    console.error('[Stripe] Invoices error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/stripe/cancel
 */
export async function cancel(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const result = await cancelSubscription(userId);

    // Send cancellation email
    try {
      const user = await (await import('../config/prisma')).prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const { sendSubscriptionCancelled } = await import('../services/email.service');
        await sendSubscriptionCancelled(
          user.email,
          user.displayName || 'User',
          new Date(result.endDate).toLocaleDateString('de-CH')
        );
      }
    } catch {}

    return res.json({ ok: true, endDate: result.endDate });
  } catch (err: any) {
    console.error('[Stripe] Cancel error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'cancel_failed' });
  }
}

/**
 * POST /api/stripe/reactivate
 */
export async function reactivate(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    await reactivateSubscription(userId);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('[Stripe] Reactivate error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'reactivate_failed' });
  }
}

/**
 * POST /api/stripe/portal
 * Body: { locale?: string }
 */
export async function portal(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { locale } = req.body;
    const result = await createBillingPortalSession(userId, locale || 'de');
    return res.json({ ok: true, url: result.url });
  } catch (err: any) {
    console.error('[Stripe] Portal error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'portal_failed' });
  }
}

/**
 * POST /api/stripe/webhook
 * No auth – uses Stripe signature verification
 */
export async function webhook(req: Request, res: Response) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    await handleWebhookEvent(req.body, signature);
    return res.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe] Webhook error:', err);
    return res.status(400).json({ error: err.message || 'webhook_failed' });
  }
}

/**
 * GET /api/stripe/plans?role=job-seeker
 * Public – returns available plans
 */
export async function plans(req: Request, res: Response) {
  try {
    const role = (req.query.role as string) || 'job_seeker';
    const plansList = await getPlans(role);
    return res.json({ ok: true, plans: plansList });
  } catch (err: any) {
    console.error('[Stripe] Plans error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}
