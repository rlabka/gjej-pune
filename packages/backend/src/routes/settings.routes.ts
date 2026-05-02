import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.middleware';
import {
  profile,
  updateProfileHandler,
  changePasswordHandler,
  updateNotificationsHandler,
  deleteAccountHandler,
  uploadProfileImageHandler,
} from '../controllers/settings.controller';

const router = Router();

// Multer for profile images
const usersUploadsDir = path.resolve(__dirname, '../../uploads/users');
if (!fs.existsSync(usersUploadsDir)) fs.mkdirSync(usersUploadsDir, { recursive: true });

const profileImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, usersUploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.get('/profile', requireAuth, profile);                    // GET  /api/settings/profile
router.put('/profile', requireAuth, updateProfileHandler);       // PUT  /api/settings/profile
router.post('/profile-image', requireAuth, profileImageUpload.single('image'), uploadProfileImageHandler); // POST /api/settings/profile-image
router.put('/password', requireAuth, changePasswordHandler);     // PUT  /api/settings/password
router.put('/notifications', requireAuth, updateNotificationsHandler); // PUT  /api/settings/notifications
router.post('/delete-account', requireAuth, deleteAccountHandler); // POST /api/settings/delete-account

export default router;
