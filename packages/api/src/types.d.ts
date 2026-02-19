/**
 * Type augmentations for express-session.
 */

import 'express-session';

// Extend express-session with our custom session data
declare module 'express-session' {
  interface SessionData {
    userId: string;
    username: string;
    isAdmin: boolean;
  }
}
