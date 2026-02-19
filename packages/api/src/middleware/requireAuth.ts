/**
 * Authentication middleware for protecting routes.
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.js';
import type { UserResponse } from '../schemas/auth.js';
import { toUserResponse } from '../schemas/auth.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserResponse;
    }
  }
}

/**
 * Middleware that requires authentication.
 * Returns 401 if user is not authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Load user from auth service
  const user = authService.getUserById(req.session.userId);
  if (!user) {
    // User no longer exists, destroy session
    req.session.destroy(() => {
      res.status(401).json({ error: 'Session invalid' });
    });
    return;
  }

  // Attach user to request (safe format, no password hash)
  req.user = toUserResponse(user);
  next();
}

/**
 * Middleware that requires admin privileges.
 * Must be used after requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ error: 'Admin privileges required' });
    return;
  }

  next();
}

/**
 * Combined middleware that requires both auth and admin.
 */
export function requireAuthAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    requireAdmin(req, res, next);
  });
}
