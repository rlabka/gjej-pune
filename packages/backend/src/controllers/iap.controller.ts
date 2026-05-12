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
 *
 * Return codes:
 *   200  signature valid + processed (or no-op like TEST notification)
 *   400  malformed request body (won't get Apple to retry)
 *   5xx  transient processing error — Apple WILL retry
 *
 * Returning 200 unconditionally would silently drop renewal / refund
 * events when our DB write or signature fails, so we let transient
 * failures bubble up.
 */
export async function appleWebhookHandler(req: Request, res: Response) {
  try {
    // Body may arrive as raw Buffer (preferred — set up via express.raw
    // middleware for this route) or parsed object (express.json fallback).
    let signedPayload: string | undefined;
    if (Buffer.isBuffer(req.body)) {
      try {
        const parsed = JSON.parse(req.body.toString('utf8'));
        signedPayload = parsed?.signedPayload;
      } catch {
        return res.status(400).json({ ok: false, error: 'invalidJson' });
      }
    } else {
      signedPayload = (req.body as any)?.signedPayload;
    }

    if (!signedPayload || typeof signedPayload !== 'string') {
      return res.status(400).json({ ok: false, error: 'missingSignedPayload' });
    }

    const result = await handleAppStoreNotification(signedPayload);
    if (result.ok) {
      return res.status(200).json({ ok: true });
    }

    // Distinguish permanent verification failures (bad signature → 200,
    // don't make Apple retry) from transient errors (5xx → Apple retries).
    if (result.code === 'verifyFailed' || result.code === 'transactionDecodeFailed') {
      console.error('[IAP] webhook permanent verify error:', result);
      return res.status(200).json({ ok: false, code: result.code });
    }

    console.error('[IAP] webhook transient error:', result);
    return res.status(500).json({ ok: false, code: result.code });
  } catch (err: any) {
    console.error('[IAP] apple-webhook unexpected error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
}
