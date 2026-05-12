import { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  verifyPurchase,
  restorePurchases,
  handleAppStoreNotification,
} from '../services/iap.service';

/**
 * POST /api/iap/verify-purchase
 * Body: { transactionId: string }
 * Called by the iOS app right after StoreKit completes a purchase.
 */
export async function verifyPurchaseHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const { transactionId } = req.body || {};
    if (!transactionId || typeof transactionId !== 'string') {
      return res.status(400).json({ ok: false, error: 'missingTransactionId' });
    }

    const result = await verifyPurchase({ userId, transactionId });
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.code });
    }
    return res.json(result);
  } catch (err: any) {
    console.error('[IAP] verify-purchase error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/iap/restore-purchases
 * Body: { transactionIds: string[] }
 * Called when the user taps "Restore Purchases" in the iOS app.
 */
export async function restorePurchasesHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const { transactionIds } = req.body || {};
    if (!Array.isArray(transactionIds)) {
      return res.status(400).json({ ok: false, error: 'missingTransactionIds' });
    }

    const result = await restorePurchases({ userId, transactionIds });
    return res.json(result);
  } catch (err: any) {
    console.error('[IAP] restore-purchases error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/iap/apple-webhook
 * Body: { signedPayload: string }
 * App Store Server Notifications V2 endpoint. Apple POSTs renewal,
 * cancellation, refund, etc. events here. No auth — verification is
 * done via JWS signature inside handleAppStoreNotification.
 */
export async function appleWebhookHandler(req: Request, res: Response) {
  try {
    const { signedPayload } = req.body || {};
    if (!signedPayload || typeof signedPayload !== 'string') {
      // Apple expects 200 even on no-op so they don't keep retrying.
      return res.status(200).json({ ok: true });
    }
    const result = await handleAppStoreNotification(signedPayload);
    // Always 200 to Apple — log internally if invalid so we don't trigger retries.
    if (!result.ok) {
      console.error('[IAP] webhook handler returned error:', result);
    }
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[IAP] apple-webhook error:', err);
    return res.status(200).json({ ok: true });
  }
}
