import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { temporalService } from './services/temporal.js';
import { workerService } from './services/worker.js';
import { settingsService } from './services/settings.js';
import workflowsRouter from './routes/workflows.js';
import configsRouter from './routes/configs.js';
import workerRouter from './routes/worker.js';
import settingsRouter from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/workflows', workflowsRouter);
app.use('/api/configs', configsRouter);
app.use('/api/worker', workerRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  const workerStatus = workerService.getStatus();
  res.json({
    status: 'ok',
    temporal: !!temporalService,
    worker: workerStatus.running,
  });
});

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
