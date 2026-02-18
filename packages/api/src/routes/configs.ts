import { Router, Request, Response } from 'express';
import { configService } from '../services/config.js';
import { SaveConfigSchema } from '../schemas/index.js';

const router: Router = Router();

// List all configs
router.get('/', async (_req: Request, res: Response) => {
  try {
    const configs = await configService.listConfigs();
    res.json({ configs });
  } catch (error) {
    console.error('Failed to list configs:', error);
    res.status(500).json({ error: 'Failed to list configs' });
  }
});

// Get a specific config
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const result = await configService.getConfig(name);

    if (!result) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }

    res.json({
      name,
      config: result.config,
      raw: result.raw,
    });
  } catch (error) {
    console.error('Failed to get config:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// Create or update a config
router.put('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    // Validate request body against schema
    const parseResult = SaveConfigSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
      return;
    }

    const { content } = parseResult.data;
    const result = await configService.saveConfig(name, content);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save config:', error);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Delete a config
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const success = await configService.deleteConfig(name);

    if (!success) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete config:', error);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

export default router;
