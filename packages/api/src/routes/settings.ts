import { Router, Request, Response } from 'express';
import { settingsService } from '../services/settings.js';
import {
  UpdateApiKeysSchema,
  UpdateRouterSchema,
  TestApiKeySchema,
  AnthropicErrorSchema,
  OpenAIErrorSchema,
  OpenRouterErrorSchema,
  safeValidate,
} from '../schemas/index.js';

const router: Router = Router();

/**
 * LLM Provider Data Privacy Notes:
 *
 * This application uses LLM provider API endpoints (NOT playground/consumer products).
 * API usage has different data retention and training policies:
 *
 * - Anthropic API: Data is NOT used for training models by default.
 *   See: https://www.anthropic.com/legal/privacy
 *
 * - OpenAI API: Data is NOT used for training models by default (as of March 2023).
 *   Enterprise customers have additional data protections.
 *   See: https://openai.com/enterprise-privacy
 *
 * - OpenRouter: Acts as a proxy; follows underlying provider policies.
 *   See: https://openrouter.ai/privacy
 *
 * For maximum privacy:
 * - Use organization IDs with explicit opt-out settings where available
 * - Avoid sending sensitive PII in prompts
 * - Review each provider's current data usage policy
 */

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
    // Validate request body against schema
    const parseResult = UpdateApiKeysSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
      return;
    }

    const { anthropicApiKey, openaiApiKey, openrouterApiKey } = parseResult.data;

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
    // Validate request body against schema
    const parseResult = UpdateRouterSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
      return;
    }

    const { routerDefault } = parseResult.data;
    await settingsService.setRouterDefault(routerDefault ?? undefined);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update router settings:', error);
    res.status(500).json({ error: 'Failed to update router settings' });
  }
});

// Test API key validity
router.post('/test-key', async (req: Request, res: Response) => {
  try {
    // Validate request body against schema
    const parseResult = TestApiKeySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
      return;
    }

    const { provider, apiKey } = parseResult.data;

    let valid = false;
    let error: string | null = null;

    if (provider === 'anthropic') {
      // Test Anthropic API key
      // Note: Anthropic API does NOT use data for training by default.
      // Using minimal test message to validate key.
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            // Anthropic API has built-in privacy: no training on API data
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        });

        // 200 or 400 (bad request but authenticated) means key is valid
        valid = response.status === 200 || response.status === 400;
        if (!valid) {
          const rawData = await response.json();
          // Validate LLM API response against schema before using
          const validatedError = safeValidate(AnthropicErrorSchema, rawData, 'Anthropic API response');
          error = validatedError?.error?.message || `HTTP ${response.status}`;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Connection failed';
      }
    } else if (provider === 'openai') {
      // Test OpenAI API key using models endpoint (no data sent)
      // Note: OpenAI API does NOT use data for training by default (since March 2023)
      // For enterprise compliance, configure organization settings in OpenAI dashboard
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${apiKey}`,
        };
        // Support optional organization ID for enterprise privacy controls
        const orgId = process.env.OPENAI_ORG_ID;
        if (orgId) {
          headers['OpenAI-Organization'] = orgId;
        }

        const response = await fetch('https://api.openai.com/v1/models', {
          headers,
        });

        valid = response.status === 200;
        if (!valid) {
          const rawData = await response.json();
          // Validate LLM API response against schema before using
          const validatedError = safeValidate(OpenAIErrorSchema, rawData, 'OpenAI API response');
          error = validatedError?.error?.message || `HTTP ${response.status}`;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Connection failed';
      }
    } else if (provider === 'openrouter') {
      // Test OpenRouter API key using models endpoint (no data sent)
      // Note: OpenRouter proxies to underlying providers; follows their policies
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            // OpenRouter app identification for request tracking
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
            'X-Title': 'Shannon Web',
          },
        });

        valid = response.status === 200;
        if (!valid) {
          const rawData = await response.json();
          // Validate LLM API response against schema before using
          const validatedError = safeValidate(OpenRouterErrorSchema, rawData, 'OpenRouter API response');
          error = validatedError?.error?.message || `HTTP ${response.status}`;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Connection failed';
      }
    }

    res.json({ valid, error });
  } catch (error) {
    console.error('Failed to test API key:', error);
    res.status(500).json({ error: 'Failed to test API key' });
  }
});

export default router;
