import { Router } from 'express';
import { toggle, listIds, savedJobs, savedAds, share } from '../controllers/favorite.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All favorite routes require authentication
router.post('/toggle', requireAuth, toggle);
router.get('/ids', requireAuth, listIds);
router.get('/saved-jobs', requireAuth, savedJobs);
router.get('/saved-ads', requireAuth, savedAds);
router.post('/share', requireAuth, share);

export default router;
