/**
 * Session middleware configuration using express-session with SQLite storage.
 *
 * Sessions are stored in a SQLite database file for persistence across
 * server restarts. Session cookies are configured for security:
 * - httpOnly: Prevents XSS access to cookies
 * - secure: HTTPS only in production
 * - sameSite: strict to prevent CSRF
 */

/// <reference path="../connect-sqlite3.d.ts" />
/// <reference path="../types.d.ts" />

import type { RequestHandler } from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import path from 'path';
import crypto from 'crypto';

const SQLiteStore = connectSqlite3(session);

const isProduction = process.env.NODE_ENV === 'production';

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || generateDefaultSecret();
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '86400000', 10); // 24 hours default
const SESSION_DB = process.env.SESSION_DB || path.join(process.env.HOME || '', '.shannon-sessions.db');

/**
 * Generate a random secret for development.
 * In production, SESSION_SECRET should always be set.
 */
function generateDefaultSecret(): string {
  if (isProduction) {
    console.warn(
      'WARNING: SESSION_SECRET not set in production! ' +
        'Set SESSION_SECRET environment variable to a secure random string.'
    );
  }
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create and configure the session middleware.
 */
export function createSessionMiddleware(): RequestHandler {
  return session({
    store: new SQLiteStore({
      db: path.basename(SESSION_DB),
      dir: path.dirname(SESSION_DB),
      table: 'sessions',
    }),
    secret: SESSION_SECRET,
    name: 'shannon.sid', // Custom cookie name
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on each request
    cookie: {
      httpOnly: true, // Prevent XSS access
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: SESSION_MAX_AGE,
      path: '/',
    },
  });
}

/**
 * Get session configuration info for debugging.
 */
export function getSessionConfig() {
  return {
    maxAge: SESSION_MAX_AGE,
    secure: isProduction,
    database: SESSION_DB,
  };
}
