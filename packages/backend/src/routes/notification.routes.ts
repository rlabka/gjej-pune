import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} from '../controllers/notification.controller';

const router = Router();

router.get('/', requireAuth, listNotifications as any);
router.get('/unread-count', requireAuth, unreadCount as any);
router.put('/:id/read', requireAuth, markRead as any);
router.put('/read-all', requireAuth, markAllRead as any);

export default router;
