import { Router, Request, Response } from 'express';
import { workerService } from '../services/worker.js';

const router: Router = Router();

// Get worker status
router.get('/status', (_req: Request, res: Response) => {
  const status = workerService.getStatus();
  res.json(status);
});

// Start the worker
router.post('/start', async (_req: Request, res: Response) => {
  try {
    const result = await workerService.start();

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true, status: workerService.getStatus() });
  } catch (error) {
    console.error('Failed to start worker:', error);
    res.status(500).json({
      error: 'Failed to start worker',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Stop the worker
router.post('/stop', async (_req: Request, res: Response) => {
  try {
    const result = await workerService.stop();

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to stop worker:', error);
    res.status(500).json({
      error: 'Failed to stop worker',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get worker logs
router.get('/logs', (_req: Request, res: Response) => {
  const status = workerService.getStatus();
  res.json({ logs: status.logs });
});

export default router;
