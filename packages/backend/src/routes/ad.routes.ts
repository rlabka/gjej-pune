import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getPackages, createCheckout, getActiveAdsHandler } from '../controllers/ad.controller';

const router = Router();

// Ensure uploads/ads directory exists
const adsUploadsDir = path.resolve(__dirname, '../../uploads/ads');
if (!fs.existsSync(adsUploadsDir)) fs.mkdirSync(adsUploadsDir, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, adsUploadsDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed') as any, false);
  },
});

// Public endpoints
router.get('/packages', getPackages);
router.post('/checkout', logoUpload.single('logo'), createCheckout);
router.get('/active', getActiveAdsHandler);

export default router;
