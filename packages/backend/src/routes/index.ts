import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import jobAdRoutes from './jobAd.routes';
import favoriteRoutes from './favorite.routes';
import settingsRoutes from './settings.routes';
import messageRoutes from './message.routes';
import cmsRoutes from './cms.routes';
import adminRoutes from './admin.routes';
import notificationRoutes from './notification.routes';
import profileViewRoutes from './profileView.routes';
import contactRoutes from './contact.routes';
import categoryRoutes from './category.routes';
import stripeRoutes from './stripe.routes';
import adRoutes from './ad.routes';
import pushRoutes from './push.routes';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { fixEmailTypos, isDeliverableEmail } from '../services/email.service';

const router = Router();

// Public email validation endpoint
router.post('/validate-email', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.json({ ok: true, valid: false });
  }
  const fixed = fixEmailTypos(email.trim().toLowerCase());
  const valid = await isDeliverableEmail(fixed);
  return res.json({ ok: true, valid, corrected: fixed !== email.trim().toLowerCase() ? fixed : undefined });
});

router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/ads', jobAdRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/settings', settingsRoutes);
router.use('/messages', messageRoutes);
router.use('/cms', cmsRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile-views', profileViewRoutes);
router.use('/contact', contactRoutes);
router.use('/stripe', stripeRoutes);
router.use('/ad-placements', adRoutes);
router.use('/push', pushRoutes);

// Public user profile (for chat profile dialog)
router.get('/users/:id/profile', requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, displayName: true, image: true, bio: true, location: true, role: true, experience: true, education: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'notFound' });
    let experience: any[] = [];
    let education: any[] = [];
    try { experience = JSON.parse(user.experience || '[]'); } catch {}
    try { education = JSON.parse(user.education || '[]'); } catch {}
    return res.json({ ok: true, profile: { ...user, experience, education } });
  } catch { return res.status(500).json({ error: 'internalError' }); }
});

// User's job ads (for chat profile dialog)
router.get('/users/:id/ads', requireAuth, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } });
    if (!user) return res.status(404).json({ error: 'notFound' });

    if (user.role === 'job-seeker') {
      const raw = await prisma.jobSeekerAd.findMany({
        where: { userId: req.params.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, category: true, livingPlace: true, status: true, createdAt: true, experience: true },
      });
      const ads = raw.map(a => ({ id: a.id, category: a.category, locationCity: a.livingPlace, status: a.status, createdAt: a.createdAt, experience: a.experience }));
      return res.json({ ok: true, ads, type: 'job-seeker' });
    } else {
      const ads = await prisma.job.findMany({
        where: { userId: req.params.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, category: true, salary: true, salaryType: true, locationCity: true, status: true, createdAt: true, currency: true },
      });
      return res.json({ ok: true, ads, type: 'employer' });
    }
  } catch { return res.status(500).json({ error: 'internalError' }); }
});

export default router;
