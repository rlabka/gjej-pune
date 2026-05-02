import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { getUserById } from '../services/auth.service';

export interface AuthenticatedRequest extends Request<Record<string, string>> {
  user?: {
    id: string;
    email: string;
    role: string;
    isPremium: boolean;
  };
}

/**
 * Middleware: Validates JWT from Authorization header.
 * Attaches user to req.user if valid.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload?.sub) {
    return res.status(401).json({ error: 'invalidToken' });
  }

  const user = await getUserById(payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'userNotFound' });
  }

  req.user = user;
  next();
}

/**
 * Middleware: Optionally parses JWT from Authorization header.
 * Attaches user to req.user if valid, but does NOT reject unauthenticated requests.
 */
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (payload?.sub) {
      const user = await getUserById(payload.sub);
      if (user) req.user = user;
    }
  }
  next();
}

/**
 * Middleware: Requires specific role(s).
 * Must be used after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}
