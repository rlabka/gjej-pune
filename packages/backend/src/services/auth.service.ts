import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import type { AuthUser, AuthRole } from '@jmp/shared';
import { fixEmailTypos, isDeliverableEmail } from './email.service';

// ─── Constants ──────────────────────────────────────────

const VALID_ROLES: AuthRole[] = ['job-seeker', 'employer'];
const BCRYPT_ROUNDS = 12;

function isValidEmail(email: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const domain = email.split('@')[1];
  if (!domain) return false;
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;
  const domainName = parts.slice(0, -1).join('.');
  if (!/[a-zA-Z]/.test(domainName)) return false;
  return true;
}

// ─── Types ──────────────────────────────────────────────

interface RegisterInput {
  email: string;
  password: string;
  role?: string;
  locale?: string;
  displayName?: string;
}

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; status: number };

// ─── Token ──────────────────────────────────────────────

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, isPremium: user.isPremium },
    env.JWT_SECRET as jwt.Secret,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

// ─── Register ───────────────────────────────────────────

export async function registerUser(
  input: RegisterInput
): Promise<ServiceResult<{ user: AuthUser; token: string }>> {
  const email = fixEmailTypos(input.email.toLowerCase().trim());
  const { password, role, displayName, locale } = input;

  if (!email || !password) {
    return { ok: false, code: 'missingCredentials', status: 400 };
  }

  if (!isValidEmail(email)) {
    return { ok: false, code: 'invalidEmail', status: 400 };
  }

  // Check if domain can actually receive emails
  const deliverable = await isDeliverableEmail(email);
  if (!deliverable) {
    return { ok: false, code: 'invalidEmail', status: 400 };
  }

  if (password.length < 6) {
    return { ok: false, code: 'passwordTooShort', status: 400 };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, code: 'emailExists', status: 409 };
  }

  const userRole: AuthRole = VALID_ROLES.includes(role as AuthRole)
    ? (role as AuthRole)
    : 'job-seeker';

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const name =
    displayName?.trim() ||
    email
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const validLocales = ['de', 'en', 'fr', 'it', 'sq'];
  const userLocale = locale && validLocales.includes(locale) ? locale : 'de';

  const dbUser = await prisma.user.create({
    data: { email, password: hashedPassword, displayName: name, role: userRole, locale: userLocale } as any,
  });

  const user: AuthUser = {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.displayName,
    role: dbUser.role as AuthRole,
    isPremium: dbUser.isPremium,
  };

  // Send welcome email (async, don't block registration)
  import('./email.service').then(({ sendWelcomeEmail }) => {
    sendWelcomeEmail(user.email, user.displayName || 'User', user.role, (dbUser as any).locale).catch((err) => {
      console.error('[Auth] Failed to send welcome email:', err);
    });
  }).catch(() => {});

  return { ok: true, data: { user, token: generateToken(user) } };
}

// ─── Login ──────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<ServiceResult<{ user: AuthUser; token: string }>> {
  const emailLower = fixEmailTypos(email.toLowerCase().trim());

  if (!emailLower || !password) {
    return { ok: false, code: 'missingCredentials', status: 400 };
  }

  const dbUser = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!dbUser) {
    return { ok: false, code: 'invalidCredentials', status: 401 };
  }

  const valid = await bcrypt.compare(password, dbUser.password);
  if (!valid) {
    return { ok: false, code: 'invalidCredentials', status: 401 };
  }

  const user: AuthUser = {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.displayName,
    role: dbUser.role as AuthRole,
    isPremium: dbUser.isPremium,
  };

  return { ok: true, data: { user, token: generateToken(user) } };
}

// ─── Google Auth (Firebase) ──────────────────────────────

interface GoogleAuthInput {
  idToken: string;
  role?: string;
  locale?: string;
}

export async function googleAuthUser(
  input: GoogleAuthInput
): Promise<ServiceResult<{ user: AuthUser; token: string; isNew: boolean }>> {
  const { firebaseAdmin } = await import('../config/firebase');

  let decoded;
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(input.idToken);
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    return { ok: false, code: 'invalidGoogleToken', status: 401 };
  }

  const email = decoded.email?.toLowerCase().trim();
  if (!email) {
    return { ok: false, code: 'missingEmail', status: 400 };
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Existing user – log them in
    const user: AuthUser = {
      id: existing.id,
      email: existing.email,
      displayName: existing.displayName,
      role: existing.role as AuthRole,
      isPremium: existing.isPremium,
    };
    return { ok: true, data: { user, token: generateToken(user), isNew: false } };
  }

  // New user – register
  const userRole: AuthRole = VALID_ROLES.includes(input.role as AuthRole)
    ? (input.role as AuthRole)
    : 'job-seeker';

  const name =
    decoded.name ||
    email
      .split('@')[0]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Generate a random password hash (Google users don't use password login)
  const randomPw = require('crypto').randomBytes(32).toString('hex');
  const hashedPassword = await bcrypt.hash(randomPw, BCRYPT_ROUNDS);

  const validLocales = ['de', 'en', 'fr', 'it', 'sq'];
  const userLocale = input.locale && validLocales.includes(input.locale) ? input.locale : 'de';

  const dbUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      displayName: name,
      role: userRole,
      image: decoded.picture || null,
      locale: userLocale,
    } as any,
  });

  const user: AuthUser = {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.displayName,
    role: dbUser.role as AuthRole,
    isPremium: dbUser.isPremium,
  };

  return { ok: true, data: { user, token: generateToken(user), isNew: true } };
}

// ─── Update Role ─────────────────────────────────────────

export async function updateUserRole(
  userId: string,
  role: string
): Promise<ServiceResult<{ user: AuthUser; token: string }>> {
  if (!VALID_ROLES.includes(role as AuthRole)) {
    return { ok: false, code: 'invalidRole', status: 400 };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    return { ok: false, code: 'userNotFound', status: 404 };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  const user: AuthUser = {
    id: updated.id,
    email: updated.email,
    displayName: updated.displayName,
    role: updated.role as AuthRole,
    isPremium: updated.isPremium,
  };

  return { ok: true, data: { user, token: generateToken(user) } };
}

// ─── Toggle Premium (Test – no payment) ─────────────────

export async function togglePremium(
  userId: string
): Promise<ServiceResult<{ user: AuthUser; token: string }>> {
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) {
    return { ok: false, code: 'userNotFound', status: 404 };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isPremium: !dbUser.isPremium },
  });

  const user: AuthUser = {
    id: updated.id,
    email: updated.email,
    displayName: updated.displayName,
    role: updated.role as AuthRole,
    isPremium: updated.isPremium,
  };

  return { ok: true, data: { user, token: generateToken(user) } };
}

// ─── Forgot Password ────────────────────────────────────

export async function forgotPassword(
  email: string
): Promise<ServiceResult<{ message: string }>> {
  const emailLower = fixEmailTypos(email.toLowerCase().trim());
  if (!emailLower) return { ok: false, code: 'missingEmail', status: 400 };

  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!user) {
    // Don't reveal if email exists — always return ok
    return { ok: true, data: { message: 'If the email exists, a reset link was sent.' } };
  }

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Generate a secure random token
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expires },
  });

  // Send email (async, don't block)
  const { sendPasswordResetEmail } = await import('./email.service');
  sendPasswordResetEmail(user.email, user.displayName || 'User', token, (user as any).locale).catch((err) => {
    console.error('[Auth] Failed to send reset email:', err);
  });

  return { ok: true, data: { message: 'If the email exists, a reset link was sent.' } };
}

// ─── Reset Password ─────────────────────────────────────

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ServiceResult<{ message: string }>> {
  if (!token || !newPassword) {
    return { ok: false, code: 'missingFields', status: 400 };
  }
  if (newPassword.length < 6) {
    return { ok: false, code: 'passwordTooShort', status: 400 };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken) {
    return { ok: false, code: 'invalidToken', status: 400 };
  }

  if (resetToken.expires < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return { ok: false, code: 'tokenExpired', status: 400 };
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  // Clean up token
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

  return { ok: true, data: { message: 'Password reset successfully.' } };
}

// ─── Get User by ID ─────────────────────────────────────

export async function getUserById(id: string): Promise<AuthUser | null> {
  const dbUser = await prisma.user.findUnique({ where: { id } });
  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.displayName,
    role: dbUser.role as AuthRole,
    isPremium: dbUser.isPremium,
  };
}
