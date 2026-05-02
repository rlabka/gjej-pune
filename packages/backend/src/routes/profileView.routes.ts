import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listProfileViewers } from '../controllers/profileView.controller';

const router = Router();

router.get('/', requireAuth, listProfileViewers as any);

export default router;
