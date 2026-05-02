import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createConversation,
  listConversations,
  listMessages,
  postMessage,
  markRead,
  unreadCount,
} from '../controllers/message.controller';
import { requireAuth } from '../middleware/auth.middleware';

const uploadsDir = path.resolve(__dirname, '../../uploads/messages');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|pdf|doc|docx|txt/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

const router = Router();

router.post('/conversations', requireAuth, createConversation);
router.get('/conversations', requireAuth, listConversations);
router.get('/conversations/:id', requireAuth, listMessages);
router.post('/conversations/:id', requireAuth, upload.single('file'), postMessage);
router.put('/conversations/:id/read', requireAuth, markRead);
router.get('/unread-count', requireAuth, unreadCount);

export default router;
