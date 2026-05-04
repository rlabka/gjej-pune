import { Request, Response } from 'express';
import { registerUser, loginUser, googleAuthUser, appleAuthUser, updateUserRole, togglePremium, getUserById, generateToken, forgotPassword as forgotPw, resetPassword as resetPw } from '../services/auth.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createNotification } from '../services/notification.service';
import { prisma } from '../config/prisma';

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response) {
  try {
    const { email, password, role, displayName, locale } = req.body;
    const result = await registerUser({ email, password, role, displayName, locale });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.code });
    }

    return res.status(201).json({
      ok: true,
      token: result.data.token,
      user: result.data.user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.code });
    }

    return res.json({
      ok: true,
      token: result.data.token,
      user: result.data.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

/**
 * POST /api/auth/google
 */
export async function googleLogin(req: Request, res: Response) {
  try {
    const { idToken, role, locale } = req.body;
    const result = await googleAuthUser({ idToken, role, locale });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.code });
    }

    return res.status(result.data.isNew ? 201 : 200).json({
      ok: true,
      token: result.data.token,
      user: result.data.user,
      isNew: result.data.isNew,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

/**
 * POST /api/auth/apple
 * Verifies Apple identityToken and signs the user in (creates if new).
 * Required for App Store approval — Apple Guideline 4.8 mandates Sign in with
 * Apple whenever third-party sign-in (Google) is offered.
 */
export async function appleLogin(req: Request, res: Response) {
  try {
    const { identityToken, fullName, role, locale } = req.body;
    const result = await appleAuthUser({ identityToken, fullName, role, locale });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.code });
    }

    return res.status(result.data.isNew ? 201 : 200).json({
      ok: true,
      token: result.data.token,
      user: result.data.user,
      isNew: result.data.isNew,
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

/**
 * PATCH /api/auth/role
 * Updates the authenticated user's role.
 */
export async function updateRole(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { role } = req.body;
    const result = await updateUserRole(userId, role);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.code });
    }

    return res.json({
      ok: true,
      token: result.data.token,
      user: result.data.user,
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

/**
 * POST /api/auth/toggle-premium
 * Toggles premium status (test – no payment).
 */
export async function togglePremiumStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const result = await togglePremium(userId);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.code });
    }

    // Send notifications on premium activation / cancellation
    if (result.data.user.isPremium) {
      createNotification(
        userId, 'premium_activated',
        'premium_activated',
        '',
        {}
      ).catch(() => {});
      createNotification(
        userId, 'boost_active',
        'boost_active',
        '',
        {}
      ).catch(() => {});
    } else {
      createNotification(
        userId, 'premium_cancelled',
        'premium_cancelled',
        '',
        {}
      ).catch(() => {});
    }

    return res.json({
      ok: true,
      token: result.data.token,
      user: result.data.user,
    });
  } catch (error) {
    console.error('Toggle premium error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

/**
 * GET /api/auth/session
 * Returns current user from JWT (requires auth middleware).
 */
export async function session(req: AuthenticatedRequest, res: Response) {
  // Return fresh data from DB (not stale JWT) so isPremium is always current
  if (req.user?.id) {
    const freshUser = await getUserById(req.user.id);
    if (freshUser) {
      const token = generateToken(freshUser);
      return res.json({
        authenticated: true,
        user: { id: freshUser.id, email: freshUser.email, role: freshUser.role, displayName: freshUser.displayName, isPremium: freshUser.isPremium },
        token,
      });
    }
  }
  return res.json({
    authenticated: true,
    user: req.user,
  });
}

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email.
 */
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const result = await forgotPw(email);

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.code });
    }

    return res.json({ ok: true, message: result.data.message });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ ok: false, error: 'internalError' });
  }
}

/**
 * PATCH /api/auth/locale
 * Updates the user's preferred locale in the DB.
 */
export async function updateLocale(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const { locale } = req.body;
    const valid = ['de', 'en', 'fr', 'it', 'sq'];
    if (!locale || !valid.includes(locale)) {
      return res.status(400).json({ error: 'invalid locale' });
    }
    await prisma.user.update({ where: { id: userId }, data: { locale } });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Update locale error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

/**
 * POST /api/auth/reset-password
 * Resets the password using a valid token.
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    const result = await resetPw(token, password);

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.code });
    }

    return res.json({ ok: true, message: result.data.message });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ ok: false, error: 'internalError' });
  }
}
