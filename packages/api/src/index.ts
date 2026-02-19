import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { temporalService } from './services/temporal.js';
import { workerService } from './services/worker.js';
import { settingsService } from './services/settings.js';
import { authService } from './services/auth.js';
import { createSessionMiddleware } from './services/session.js';
import { requireAuth } from './middleware/requireAuth.js';
import authRouter from './routes/auth.js';
import workflowsRouter from './routes/workflows.js';
import configsRouter from './routes/configs.js';
import workerRouter from './routes/worker.js';
import settingsRouter from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware - Helmet sets various HTTP security headers
// See: https://helmetjs.github.io/
app.use(
  helmet({
    // Content Security Policy - configured for SPA with API
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI frameworks
            imgSrc: ["'self'", 'data:', 'blob:'],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false, // Disable CSP in development for hot reload
    // HTTP Strict Transport Security - enforce HTTPS in production
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Disable X-Powered-By header
    hidePoweredBy: true,
    // Prevent MIME type sniffing
    noSniff: true,
    // XSS filter (legacy browsers)
    xssFilter: true,
    // Referrer policy
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// CORS middleware - configure for credentials (cookies)
app.use(
  cors({
    origin: isProduction ? true : ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true, // Allow cookies to be sent
  })
);

// JSON body parser
app.use(express.json());

// Session middleware - must be before routes
app.use(createSessionMiddleware());

// Public routes (no authentication required)
app.use('/api/auth', authRouter);

// Health check (public)
app.get('/api/health', (_req, res) => {
  const workerStatus = workerService.getStatus();
  res.json({
    status: 'ok',
    temporal: !!temporalService,
    worker: workerStatus.running,
  });
});

// Protected API routes (authentication required)
app.use('/api/workflows', requireAuth, workflowsRouter);
app.use('/api/configs', requireAuth, configsRouter);
app.use('/api/worker', requireAuth, workerRouter);
app.use('/api/settings', requireAuth, settingsRouter);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const webDistPath = path.join(__dirname, '../../web/dist');
  app.use(express.static(webDistPath));

  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    // Initialize auth service (loads users, bootstraps admin if needed)
    await authService.initialize();

    // Load settings
    await settingsService.load();

    // Connect to Temporal
    await temporalService.connect();

    app.listen(PORT, () => {
      console.log(`Shannon API server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
