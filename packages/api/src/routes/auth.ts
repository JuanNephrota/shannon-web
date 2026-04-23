/**
 * Authentication routes for login, logout, and user management.
 */

import { Router, Request, Response } from 'express';
import { authService, LastAdminError } from '../services/auth.js';
import { requireAuth, requireAuthAdmin } from '../middleware/requireAuth.js';
import {
  LoginSchema,
  CreateUserSchema,
  UpdateUserSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
  toUserResponse,
} from '../schemas/auth.js';

const router: Router = Router();

/** Convenience: surface Zod validation failures as a 400. */
function respondWithParseError(
  res: Response,
  parseResult: { error: { issues: Array<{ path: PropertyKey[]; message: string }> } }
): void {
  res.status(400).json({
    error: 'Invalid request body',
    details: parseResult.error.issues.map(
      (i) => `${i.path.map(String).join('.')}: ${i.message}`
    ),
  });
}

/**
 * POST /api/auth/login
 * Authenticate user and create session.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      respondWithParseError(res, parseResult);
      return;
    }

    const { username, password } = parseResult.data;

    // Verify credentials (refuses disabled accounts under the hood).
    const user = await authService.verifyPassword(username, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Create session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin;

    // Save session before responding
    req.session.save(async (err) => {
      if (err) {
        console.error('Failed to save session:', err);
        res.status(500).json({ error: 'Failed to create session' });
        return;
      }

      // Best-effort stamp of last login; failure shouldn't block sign-in.
      try {
        await authService.recordLogin(user.id);
      } catch (e) {
        console.warn('Failed to stamp lastLoginAt:', e);
      }

      res.json({
        success: true,
        user: toUserResponse(user),
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session and logout user.
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
      res.status(500).json({ error: 'Logout failed' });
      return;
    }

    res.clearCookie('shannon.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ success: true });
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user.
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

/**
 * PATCH /api/auth/me
 * Self-service profile edit (currently: email).
 */
router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const parseResult = UpdateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      respondWithParseError(res, parseResult);
      return;
    }
    const user = await authService.updateOwnProfile(req.user!.id, parseResult.data);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/password
 * Self-service password change. Requires correct current password.
 */
router.post('/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const parseResult = ChangePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      respondWithParseError(res, parseResult);
      return;
    }
    const { currentPassword, newPassword } = parseResult.data;
    const ok = await authService.changeOwnPassword(
      req.user!.id,
      currentPassword,
      newPassword
    );
    if (!ok) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to change password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * GET /api/auth/users
 * List all users (admin only).
 */
router.get('/users', requireAuthAdmin, (_req: Request, res: Response) => {
  try {
    const users = authService.listUsers();
    res.json({ users });
  } catch (error) {
    console.error('Failed to list users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * POST /api/auth/users
 * Create a new user (admin only).
 */
router.post('/users', requireAuthAdmin, async (req: Request, res: Response) => {
  try {
    const parseResult = CreateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      respondWithParseError(res, parseResult);
      return;
    }

    const user = await authService.createUser(parseResult.data, req.user!.id);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === 'Username already exists') {
      res.status(409).json({ error: error.message });
      return;
    }
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PATCH /api/auth/users/:id
 * Admin edit: email, isAdmin, disabled. Never password (use /password).
 * Enforces:
 *   - Admins cannot demote themselves (prevents accidental lockout)
 *   - Admins cannot disable themselves
 *   - The system must retain at least one enabled admin
 */
router.patch('/users/:id', requireAuthAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = UpdateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      respondWithParseError(res, parseResult);
      return;
    }

    const input = parseResult.data;

    // Self-protection: admins can't demote or disable themselves.
    if (id === req.user!.id) {
      if (input.isAdmin === false) {
        res.status(400).json({ error: 'Cannot remove admin from your own account' });
        return;
      }
      if (input.disabled === true) {
        res.status(400).json({ error: 'Cannot disable your own account' });
        return;
      }
    }

    const user = await authService.updateUser(id, input);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    if (error instanceof LastAdminError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Failed to update user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * POST /api/auth/users/:id/password
 * Admin password reset for another user.
 */
router.post(
  '/users/:id/password',
  requireAuthAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const parseResult = ResetPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        respondWithParseError(res, parseResult);
        return;
      }

      const target = authService.getUserById(id);
      if (!target) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      await authService.resetPassword(id, parseResult.data.password);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to reset password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

/**
 * DELETE /api/auth/users/:id
 * Delete a user (admin only).
 */
router.delete('/users/:id', requireAuthAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    // Check if this would delete the last admin
    const targetUser = authService.getUserById(id);
    if (targetUser?.isAdmin && authService.getAdminCount() <= 1) {
      res.status(400).json({ error: 'Cannot delete the last admin user' });
      return;
    }

    const deleted = await authService.deleteUser(id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
