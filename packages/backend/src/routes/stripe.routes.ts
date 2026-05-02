import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  checkout,
  subscription,
  invoices,
  cancel,
  reactivate,
  portal,
  webhook,
  plans,
} from '../controllers/stripe.controller';

const router = Router();

// Public
router.get('/plans', plans);

// Webhook (no auth – raw body handled in server.ts)
router.post('/webhook', webhook);

// Protected routes
router.post('/checkout', requireAuth, checkout);
router.get('/subscription', requireAuth, subscription);
router.get('/invoices', requireAuth, invoices);
router.post('/cancel', requireAuth, cancel);
router.post('/reactivate', requireAuth, reactivate);
router.post('/portal', requireAuth, portal);

export default router;
