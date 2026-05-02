import { Router } from 'express';
import { register, unregister } from '../controllers/push.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', requireAuth, register);
router.post('/unregister', requireAuth, unregister);

export default router;
