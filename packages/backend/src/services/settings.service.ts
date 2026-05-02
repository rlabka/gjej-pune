import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';

// ─── Get Profile ────────────────────────────────────────

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      bio: true,
      location: true,
      website: true,
      experience: true,
      education: true,
      documents: true,
      createdAt: true,
      settings: true,
    },
  });
  if (!user) return null;

  // Auto-create settings if not exist
  if (!user.settings) {
    const settings = await prisma.userSettings.create({
      data: { userId },
    });
    return { ...user, settings };
  }

  return user;
}

// ─── Update Profile ─────────────────────────────────────

interface ProfileUpdate {
  displayName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  experience?: any[];
  education?: any[];
  documents?: any[];
}

export async function updateProfile(userId: string, data: ProfileUpdate) {
  // Check email uniqueness if changing
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      return { error: 'emailTaken' };
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.bio !== undefined && { bio: data.bio || null }),
      ...(data.location !== undefined && { location: data.location || null }),
      ...(data.website !== undefined && { website: data.website || null }),
      ...(data.experience !== undefined && { experience: JSON.stringify(data.experience) }),
      ...(data.education !== undefined && { education: JSON.stringify(data.education) }),
      ...(data.documents !== undefined && { documents: JSON.stringify(data.documents) }),
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      bio: true,
      location: true,
      website: true,
      experience: true,
      education: true,
      documents: true,
    },
  });

  return { user };
}

// ─── Change Password ────────────────────────────────────

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'notFound' };

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { error: 'wrongPassword' };

  if (newPassword.length < 6) return { error: 'passwordTooShort' };

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { ok: true };
}

// ─── Update Notifications ───────────────────────────────

export async function updateNotifications(
  userId: string,
  data: { emailNotifications?: boolean; interviewReminders?: boolean; newMessageAlerts?: boolean }
) {
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });

  return settings;
}

// ─── Delete Account ─────────────────────────────────────

export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: 'notFound' };

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: 'wrongPassword' };

  await prisma.user.delete({ where: { id: userId } });
  return { ok: true };
}
