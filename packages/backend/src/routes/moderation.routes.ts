import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  blockUserHandler,
  unblockUserHandler,
  listBlockedHandler,
  createReportHandler,
} from '../controllers/moderation.controller';

const router = Router();

// Block management
router.get('/users/blocked', requireAuth as any, listBlockedHandler as any);
router.post('/users/:id/block', requireAuth as any, blockUserHandler as any);
router.delete('/users/:id/block', requireAuth as any, unblockUserHandler as any);

// Reports — anyone authenticated can submit
router.post('/reports', requireAuth as any, createReportHandler as any);

export default router;
