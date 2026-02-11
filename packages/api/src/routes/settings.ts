import { Router, Request, Response } from 'express';
import { settingsService } from '../services/settings.js';

const router: Router = Router();

// Get current settings (with masked API keys)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = settingsService.getSettings();
    const maskedKeys = settingsService.getMaskedApiKeys();

    res.json({
      apiKeys: maskedKeys,
      routerDefault: settings.routerDefault || null,
      hasAnthropicKey: settingsService.hasAnthropicKey(),
    });
  } catch (error) {
    console.error('Failed to get settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update API keys
router.put('/api-keys', async (req: Request, res: Response) => {
  try {
    const { anthropicApiKey, openaiApiKey, openrouterApiKey } = req.body;

    // Only update keys that are explicitly provided in the request
    const updates: Record<string, string | undefined> = {};

    if ('anthropicApiKey' in req.body) {
      updates.anthropicApiKey = anthropicApiKey;
    }
    if ('openaiApiKey' in req.body) {
      updates.openaiApiKey = openaiApiKey;
    }
    if ('openrouterApiKey' in req.body) {
      updates.openrouterApiKey = openrouterApiKey;
    }

    await settingsService.setApiKeys(updates);

    res.json({
      success: true,
      apiKeys: settingsService.getMaskedApiKeys(),
    });
  } catch (error) {
    console.error('Failed to update API keys:', error);
    res.status(500).json({ error: 'Failed to update API keys' });
  }
});

// Update router default
router.put('/router', async (req: Request, res: Response) => {
  try {
    const { routerDefault } = req.body;

    await settingsService.setRouterDefault(routerDefault);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update router settings:', error);
    res.status(500).json({ error: 'Failed to update router settings' });
  }
});

// Test API key validity
router.post('/test-key', async (req: Request, res: Response) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      res.status(400).json({ error: 'Provider and apiKey are required' });
      return;
    }

    let valid = false;
    let error: string | null = null;

    if (provider === 'anthropic') {
      // Test Anthropic API key
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });

        // 200 or 400 (bad request but authenticated) means key is valid
        valid = response.status === 200 || response.status === 400;
        if (!valid) {
          const data = await response.json();
          error = data.error?.message || `HTTP ${response.status}`;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Connection failed';
      }
    } else if (provider === 'openai') {
      // Test OpenAI API key
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        valid = response.status === 200;
        if (!valid) {
          const data = await response.json();
          error = data.error?.message || `HTTP ${response.status}`;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Connection failed';
      }
    } else if (provider === 'openrouter') {
      // Test OpenRouter API key
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        valid = response.status === 200;
        if (!valid) {
          const data = await response.json();
          error = data.error?.message || `HTTP ${response.status}`;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Connection failed';
      }
    } else {
      res.status(400).json({ error: 'Unknown provider' });
      return;
    }

    res.json({ valid, error });
  } catch (error) {
    console.error('Failed to test API key:', error);
    res.status(500).json({ error: 'Failed to test API key' });
  }
});

export default router;
