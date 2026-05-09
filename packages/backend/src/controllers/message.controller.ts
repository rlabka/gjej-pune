import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../services/message.service';
import { emitToUser } from '../websocket';
import { prisma } from '../config/prisma';

// POST /api/messages/conversations — create or find conversation
export async function createConversation(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const { targetUserId, jobId, jobTitle } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });
    if (targetUserId === req.user.id) return res.status(400).json({ error: 'cannotMessageSelf' });

    const conv = await getOrCreateConversation(req.user.id, targetUserId, jobId, jobTitle);
    return res.json({ ok: true, conversation: conv });
  } catch (error: any) {
    if (error?.message === 'blocked') {
      return res.status(403).json({ ok: false, error: 'blocked' });
    }
    console.error('Create conversation error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

// GET /api/messages/conversations — list all conversations
export async function listConversations(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    // Job seekers chat for free (treated as premium)
    const effectivePremium = req.user.role === 'job-seeker' ? true : (req.user.isPremium ?? false);
    const conversations = await getConversations(req.user.id, effectivePremium);
    return res.json({ ok: true, conversations });
  } catch (error) {
    console.error('List conversations error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

// GET /api/messages/conversations/:id — get messages
export async function listMessages(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const convId = req.params.id as string;
    // Job seekers chat for free (treated as premium)
    const effectivePremium = req.user.role === 'job-seeker' ? true : (req.user.isPremium ?? false);
    const messages = await getMessages(convId, req.user.id, effectivePremium);
    if (messages === null) return res.status(403).json({ error: 'forbidden' });

    // Mark messages as read when opening conversation
    await markAsRead(convId, req.user.id);

    return res.json({ ok: true, messages });
  } catch (error) {
    console.error('List messages error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

// POST /api/messages/conversations/:id — send a message (with optional file)
export async function postMessage(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const { text } = req.body;
    const file = (req as any).file as Express.Multer.File | undefined;

    if ((!text || !text.trim()) && !file) return res.status(400).json({ error: 'text or file required' });

    const convId = req.params.id as string;

    // Job seekers chat for free; employers always need premium to send any message
    if (!req.user.isPremium && req.user.role !== 'job-seeker') {
      return res.status(403).json({ error: 'premiumRequired' });
    }

    const fileData = file ? {
      fileUrl: `/uploads/messages/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
    } : undefined;
    const message = await sendMessage(convId, req.user.id, text?.trim() || '', fileData);
    if (!message) return res.status(403).json({ error: 'forbidden' });

    // Emit via WebSocket to both participants
    const conv = await prisma.conversation.findUnique({ where: { id: convId } });
    if (conv) {
      const recipientId = conv.participant1 === req.user.id ? conv.participant2 : conv.participant1;
      const payload = { conversationId: convId, message };
      emitToUser(recipientId, 'message:new', payload);
      emitToUser(req.user.id, 'message:sent', payload);
    }

    return res.json({ ok: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

// PUT /api/messages/conversations/:id/read — mark as read
export async function markRead(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    await markAsRead(req.params.id as string, req.user.id);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

// GET /api/messages/unread-count — total unread
export async function unreadCount(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const count = await getUnreadCount(req.user.id);
    return res.json({ ok: true, count });
  } catch (error) {
    console.error('Unread count error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}
