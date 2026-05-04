import { Router } from 'express';
import { register, login, googleLogin, appleLogin, updateRole, togglePremiumStatus, session, updateLocale, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/apple', appleLogin);
router.patch('/role', requireAuth, updateRole);
router.patch('/locale', requireAuth, updateLocale);
router.post('/toggle-premium', requireAuth, togglePremiumStatus);
router.get('/session', requireAuth, session);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
