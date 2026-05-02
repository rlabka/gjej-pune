import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import path from 'path';
import fs from 'fs';

const VALID_LOCALES = ['de', 'en', 'fr', 'it', 'sq'];

/**
 * GET /api/cms/content
 * Public – returns all content overrides, optionally filtered by locale.
 */
export async function getAllContent(req: Request, res: Response) {
  try {
    const { locale } = req.query;
    const where = locale && VALID_LOCALES.includes(locale as string)
      ? { locale: locale as string }
      : {};

    const rows = await prisma.siteContent.findMany({ where, orderBy: [{ section: 'asc' }, { fieldKey: 'asc' }] });

    // Group by section.fieldKey.locale for easy consumption
    const grouped: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      const key = `${row.section}`;
      if (!grouped[key]) grouped[key] = {};
      grouped[key][`${row.fieldKey}`] = row.value;
    }

    res.json({ ok: true, content: rows, grouped });
  } catch (err) {
    console.error('[CMS] getAllContent error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * GET /api/cms/content/:section
 * Public – returns overrides for a specific section.
 */
export async function getSectionContent(req: Request, res: Response) {
  try {
    const { section } = req.params;
    const { locale } = req.query;
    const where: any = { section };
    if (locale && VALID_LOCALES.includes(locale as string)) {
      where.locale = locale as string;
    }

    const rows = await prisma.siteContent.findMany({ where, orderBy: { fieldKey: 'asc' } });
    res.json({ ok: true, content: rows });
  } catch (err) {
    console.error('[CMS] getSectionContent error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PUT /api/cms/content
 * Admin-only – batch upsert content overrides.
 * Body: { items: [{ section, fieldKey, locale, value, type? }] }
 */
export async function upsertContent(req: AuthenticatedRequest, res: Response) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: 'items array required' });
    }

    const results = [];
    for (const item of items) {
      const { section, fieldKey, locale, value, type } = item;
      if (!section || !fieldKey || !locale || !VALID_LOCALES.includes(locale)) {
        continue; // skip invalid entries
      }

      // If value is empty, delete the override (fallback to default)
      if (value === '' || value === null || value === undefined) {
        await prisma.siteContent.deleteMany({
          where: { section, fieldKey, locale },
        });
        results.push({ section, fieldKey, locale, action: 'deleted' });
        continue;
      }

      const upserted = await prisma.siteContent.upsert({
        where: { section_fieldKey_locale: { section, fieldKey, locale } },
        update: { value, type: type || 'text' },
        create: { section, fieldKey, locale, value, type: type || 'text' },
      });
      results.push({ ...upserted, action: 'upserted' });
    }

    res.json({ ok: true, results });
  } catch (err) {
    console.error('[CMS] upsertContent error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/cms/content/:section
 * Admin-only – delete all overrides for a section (optionally filtered by locale).
 */
export async function deleteSectionContent(req: AuthenticatedRequest, res: Response) {
  try {
    const { section } = req.params;
    const { locale } = req.query;
    const where: any = { section };
    if (locale && VALID_LOCALES.includes(locale as string)) {
      where.locale = locale as string;
    }

    const deleted = await prisma.siteContent.deleteMany({ where });
    res.json({ ok: true, deletedCount: deleted.count });
  } catch (err) {
    console.error('[CMS] deleteSectionContent error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/cms/upload
 * Admin-only – upload an image for CMS content.
 * Uses multipart form data with field "file".
 */
export async function uploadImage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }

    const uploadsDir = path.resolve(__dirname, '../../uploads/cms');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname) || '.png';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const url = `/uploads/cms/${filename}`;
    res.json({ ok: true, url });
  } catch (err) {
    console.error('[CMS] uploadImage error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}
