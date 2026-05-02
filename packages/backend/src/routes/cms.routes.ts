import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  getAllContent,
  getSectionContent,
  upsertContent,
  deleteSectionContent,
  uploadImage,
} from '../controllers/cms.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public endpoints
router.get('/content', getAllContent as any);
router.get('/content/:section', getSectionContent as any);

// Admin-only endpoints
router.put('/content', requireAuth as any, requireRole('admin') as any, upsertContent as any);
router.delete('/content/:section', requireAuth as any, requireRole('admin') as any, deleteSectionContent as any);
router.post('/upload', requireAuth as any, requireRole('admin') as any, upload.single('file'), uploadImage as any);

export default router;
