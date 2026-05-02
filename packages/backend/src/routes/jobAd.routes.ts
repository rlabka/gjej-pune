import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { create, myAds, list, categories, getOne, update, remove, uploadPhoto } from '../controllers/jobAd.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const uploadsDir = path.resolve(__dirname, '../../uploads/ads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  cb(null, allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype.split('/')[1]));
}});

const createAdRules = [
  { field: 'category', required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
  { field: 'firstName', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
  { field: 'surname', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
  { field: 'phone', required: true, type: 'phone' as const },
  { field: 'email', type: 'email' as const },
  { field: 'experience', type: 'string' as const, maxLength: 50 },
  { field: 'availability', oneOf: ['immediate', 'negotiable'] },
  { field: 'livingPlace', type: 'string' as const, maxLength: 200 },
  { field: 'skills', type: 'array' as const },
  { field: 'spokenLanguages', type: 'array' as const },
];

const router = Router();

router.get('/', list);                                         // GET  /api/ads          (public, paginated)
router.get('/categories', categories);                          // GET  /api/ads/categories (public)
router.get('/mine', requireAuth, myAds);                       // GET  /api/ads/mine     (auth)
router.get('/:id', optionalAuth as any, getOne);               // GET  /api/ads/:id      (public, optional auth for profile view tracking)
router.post('/', requireAuth, validate(createAdRules), create); // POST /api/ads          (auth, validated)
router.put('/:id', requireAuth, update);                       // PUT  /api/ads/:id      (auth)
router.post('/:id/photo', requireAuth, upload.single('photo'), uploadPhoto); // POST /api/ads/:id/photo (auth, file)
router.delete('/:id', requireAuth, remove);                    // DEL  /api/ads/:id      (auth)

export default router;
