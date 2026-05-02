import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

/**
 * GET /api/categories
 * Public endpoint – returns all category groups with their titles,
 * ordered by `order` field. Used by the frontend for filters,
 * autocomplete, and display translation.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.jobCategoryGroup.findMany({
      include: { titles: { orderBy: { key: 'asc' } } },
      orderBy: { order: 'asc' },
    });

    // Shape into the same structure the frontend expects
    const categories = groups.map((g) => ({
      id: g.id,
      slug: g.slug,
      icon: g.icon,
      labels: g.labels as Record<string, string>,
      titles: g.titles.map((t) => ({
        id: t.id,
        key: t.key,
        labels: t.labels as Record<string, string>,
      })),
    }));

    res.json({ ok: true, categories });
  } catch (err) {
    console.error('[Categories] list error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
});

export default router;
