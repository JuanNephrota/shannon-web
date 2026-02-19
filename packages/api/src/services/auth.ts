/**
 * Authentication service for user management and password verification.
 *
 * Users are stored in a JSON file (~/.shannon-users.json by default).
 * Passwords are hashed using bcrypt with a cost factor of 12.
 */

import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  UsersFileSchema,
  type StoredUser,
  type UsersFile,
  type CreateUserInput,
  type UserResponse,
  toUserResponse,
} from '../schemas/auth.js';

const BCRYPT_ROUNDS = 12;
const USERS_FILE = process.env.USERS_FILE || path.join(process.env.HOME || '', '.shannon-users.json');

class AuthService {
  private users: StoredUser[] = [];
  private loaded = false;

  /**
   * Load users from file and bootstrap admin user if needed.
   */
  async initialize(): Promise<void> {
    if (this.loaded) return;

    await this.loadUsers();

    // Bootstrap admin user from environment variables if no users exist
    if (this.users.length === 0) {
      await this.bootstrapAdminUser();
    }

    this.loaded = true;
  }

  /**
   * Load users from the JSON file.
   */
  private async loadUsers(): Promise<void> {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      const validated = UsersFileSchema.safeParse(parsed);

      if (validated.success) {
        this.users = validated.data.users;
        console.log(`Loaded ${this.users.length} users from ${USERS_FILE}`);
      } else {
        console.warn('Users file failed validation, starting fresh');
        this.users = [];
      }
    } catch {
      // File doesn't exist, start with empty users
      this.users = [];
    }
  }

  /**
   * Save users to the JSON file.
   */
  private async saveUsers(): Promise<void> {
    const data: UsersFile = { users: this.users };
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Bootstrap the first admin user from environment variables.
   */
  private async bootstrapAdminUser(): Promise<void> {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      console.warn(
        'No users exist and ADMIN_USERNAME/ADMIN_PASSWORD not set. ' +
          'Set these environment variables to create the initial admin user.'
      );
      return;
    }

    if (password === 'changeme' || password.length < 8) {
      console.warn(
        'WARNING: Using weak or default admin password. ' +
          'Please change ADMIN_PASSWORD to a strong password.'
      );
    }

    try {
      await this.createUser(
        {
          username,
          password,
          isAdmin: true,
        },
        null // No creator for bootstrap user
      );
      console.log(`Created initial admin user: ${username}`);
    } catch (error) {
      console.error('Failed to create initial admin user:', error);
    }
  }

  /**
   * Create a new user.
   */
  async createUser(input: CreateUserInput, createdBy: string | null): Promise<UserResponse> {
    // Check if username already exists
    if (this.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
      throw new Error('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user: StoredUser = {
      id: uuidv4(),
      username: input.username,
      email: input.email || null,
      passwordHash,
      isAdmin: input.isAdmin ?? false,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    this.users.push(user);
    await this.saveUsers();

    return toUserResponse(user);
  }

  /**
   * Verify a user's password.
   */
  async verifyPassword(username: string, password: string): Promise<StoredUser | null> {
    const user = this.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      // Use constant-time comparison to prevent timing attacks
      await bcrypt.hash(password, BCRYPT_ROUNDS);
      return null;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  /**
   * Get a user by ID.
   */
  getUserById(id: string): StoredUser | null {
    return this.users.find((u) => u.id === id) || null;
  }

  /**
   * Get a user by username.
   */
  getUserByUsername(username: string): StoredUser | null {
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  /**
   * List all users (safe response format).
   */
  listUsers(): UserResponse[] {
    return this.users.map(toUserResponse);
  }

  /**
   * Delete a user by ID.
   */
  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return false;
    }

    this.users.splice(index, 1);
    await this.saveUsers();
    return true;
  }

  /**
   * Check if any users exist.
   */
  hasUsers(): boolean {
    return this.users.length > 0;
  }

  /**
   * Get count of admin users.
   */
  getAdminCount(): number {
    return this.users.filter((u) => u.isAdmin).length;
  }
}

export const authService = new AuthService();
