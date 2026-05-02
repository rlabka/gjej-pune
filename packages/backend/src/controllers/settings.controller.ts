import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateNotifications,
  deleteAccount,
} from '../services/settings.service';

export async function profile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const data = await getProfile(req.user.id);
    if (!data) return res.status(404).json({ error: 'notFound' });
    return res.json({ ok: true, profile: data });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function updateProfileHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const result = await updateProfile(req.user.id, req.body);
    if ('error' in result) return res.status(400).json({ error: result.error });
    return res.json({ ok: true, user: result.user });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function changePasswordHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'missingFields' });
    const result = await changePassword(req.user.id, currentPassword, newPassword);
    if ('error' in result) return res.status(400).json({ error: result.error });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function updateNotificationsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const settings = await updateNotifications(req.user.id, req.body);
    return res.json({ ok: true, settings });
  } catch (error) {
    console.error('Update notifications error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function uploadProfileImageHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'noFile' });

    const image = `/uploads/users/${req.file.filename}`;
    await prisma.user.update({ where: { id: req.user.id }, data: { image } });

    return res.json({ ok: true, image });
  } catch (error) {
    console.error('Upload profile image error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function deleteAccountHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'missingFields' });
    const result = await deleteAccount(req.user.id, password);
    if ('error' in result) return res.status(400).json({ error: result.error });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}
