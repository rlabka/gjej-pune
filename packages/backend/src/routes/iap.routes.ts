import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  verifyPurchaseHandler,
  restorePurchasesHandler,
  appleWebhookHandler,
} from '../controllers/iap.controller';

const router = Router();

// User-facing endpoints (authenticated)
router.post('/verify-purchase', requireAuth as any, verifyPurchaseHandler as any);
router.post('/restore-purchases', requireAuth as any, restorePurchasesHandler as any);

// Apple webhook (unauthenticated — JWS-signed, verified inside handler)
router.post('/apple-webhook', appleWebhookHandler as any);

export default router;
