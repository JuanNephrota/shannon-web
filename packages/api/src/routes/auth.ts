/**
 * Authentication routes for login, logout, and user management.
 */

import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.js';
import { requireAuth, requireAuthAdmin } from '../middleware/requireAuth.js';
import { LoginSchema, CreateUserSchema, toUserResponse } from '../schemas/auth.js';

const router: Router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and create session.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
      return;
    }

    const { username, password } = parseResult.data;

    // Verify credentials
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
    req.session.save((err) => {
      if (err) {
        console.error('Failed to save session:', err);
        res.status(500).json({ error: 'Failed to create session' });
        return;
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

    // Clear the session cookie
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
    // Validate request body
    const parseResult = CreateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
      return;
    }

    // Create user
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
