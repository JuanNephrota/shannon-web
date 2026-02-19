/**
 * Authentication schemas for request validation.
 */

import { z } from 'zod';

// ============================================
// Request Schemas
// ============================================

/** Schema for login request */
export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/** Schema for creating a new user */
export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  email: z.string().email('Invalid email address').optional(),
  isAdmin: z.boolean().optional().default(false),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// ============================================
// Internal Data Schemas
// ============================================

/** Schema for stored user data */
export const StoredUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().nullable(),
  passwordHash: z.string(),
  isAdmin: z.boolean(),
  createdAt: z.string().datetime(),
  createdBy: z.string().uuid().nullable(),
});
export type StoredUser = z.infer<typeof StoredUserSchema>;

/** Schema for users file */
export const UsersFileSchema = z.object({
  users: z.array(StoredUserSchema),
});
export type UsersFile = z.infer<typeof UsersFileSchema>;

// ============================================
// Response Schemas (safe to send to client)
// ============================================

/** User data safe to return to client (no password hash) */
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().nullable(),
  isAdmin: z.boolean(),
  createdAt: z.string().datetime(),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * Convert stored user to safe response format
 */
export function toUserResponse(user: StoredUser): UserResponse {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}
