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

/** Password strength rules — shared between create / reset / self-change. */
const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters');

const usernameField = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

/** Schema for creating a new user */
export const CreateUserSchema = z.object({
  username: usernameField,
  password: passwordField,
  email: z.string().email('Invalid email address').optional(),
  isAdmin: z.boolean().optional().default(false),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

/** Schema for an admin editing another user. All fields optional. */
export const UpdateUserSchema = z
  .object({
    email: z.string().email('Invalid email address').nullable().optional(),
    isAdmin: z.boolean().optional(),
    disabled: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.email !== undefined ||
      data.isAdmin !== undefined ||
      data.disabled !== undefined,
    { message: 'At least one field must be provided' }
  );
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

/** Schema for an admin resetting another user's password. */
export const ResetPasswordSchema = z.object({
  password: passwordField,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/** Schema for a user changing their own password. */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordField,
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/** Schema for a user editing their own profile fields. */
export const UpdateProfileSchema = z
  .object({
    email: z.string().email('Invalid email address').nullable().optional(),
  })
  .refine((data) => data.email !== undefined, {
    message: 'At least one field must be provided',
  });
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// ============================================
// Internal Data Schemas
// ============================================

/**
 * Schema for stored user data.
 *
 * `disabled` and `lastLogin` are recent additions — they default when
 * absent so users written by earlier versions keep loading cleanly.
 */
export const StoredUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().nullable(),
  passwordHash: z.string(),
  isAdmin: z.boolean(),
  disabled: z.boolean().optional().default(false),
  createdAt: z.string().datetime(),
  createdBy: z.string().uuid().nullable(),
  lastLoginAt: z.string().datetime().nullable().optional().default(null),
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
  disabled: z.boolean(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable(),
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
    disabled: user.disabled ?? false,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}
