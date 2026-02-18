/**
 * Zod schemas for input validation and type safety.
 *
 * This module provides schema validation for:
 * - API request bodies (user input)
 * - External file data (session.json, settings.json, configs)
 * - LLM API responses (structured outputs)
 *
 * All external data should be validated before use to prevent
 * injection attacks, type confusion, and data integrity issues.
 */

import { z } from 'zod';

// ============================================
// API Request Schemas
// ============================================

/** Schema for starting a new workflow */
export const StartWorkflowSchema = z.object({
  webUrl: z.string().url('Invalid URL format'),
  repoPath: z.string().min(1, 'Repository path is required'),
  configName: z.string().optional(),
  outputPath: z.string().optional(),
  pipelineTestingMode: z.boolean().optional(),
});
export type StartWorkflowInput = z.infer<typeof StartWorkflowSchema>;

/** Schema for updating API keys */
export const UpdateApiKeysSchema = z.object({
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
});
export type UpdateApiKeysInput = z.infer<typeof UpdateApiKeysSchema>;

/** Schema for updating router default */
export const UpdateRouterSchema = z.object({
  routerDefault: z.string().nullable().optional(),
});
export type UpdateRouterInput = z.infer<typeof UpdateRouterSchema>;

/** Schema for testing an API key */
export const TestApiKeySchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'openrouter'], {
    message: 'Provider must be anthropic, openai, or openrouter',
  }),
  apiKey: z.string().min(1, 'API key is required'),
});
export type TestApiKeyInput = z.infer<typeof TestApiKeySchema>;

/** Schema for saving config content */
export const SaveConfigSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});
export type SaveConfigInput = z.infer<typeof SaveConfigSchema>;

// ============================================
// External File Schemas (Session, Settings)
// ============================================

/** Schema for session.json metrics file */
export const SessionMetricsSchema = z.object({
  session: z.object({
    id: z.string(),
    createdAt: z.string(),
    targetUrl: z.string(),
  }).partial(),
  metrics: z.object({
    total_duration_ms: z.number().default(0),
    total_cost_usd: z.number().default(0),
    total_input_tokens: z.number().default(0),
    total_output_tokens: z.number().default(0),
  }).partial(),
  agents: z.record(z.string(), z.unknown()).optional(),
}).passthrough(); // Allow additional fields for forward compatibility
export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;

/** Schema for API keys in settings */
export const ApiKeysSchema = z.object({
  anthropicApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
});
export type ApiKeys = z.infer<typeof ApiKeysSchema>;

/** Schema for settings.json file */
export const SettingsSchema = z.object({
  apiKeys: ApiKeysSchema.default({}),
  routerDefault: z.string().optional(),
}).passthrough();
export type Settings = z.infer<typeof SettingsSchema>;

// ============================================
// Config File Schemas (YAML)
// ============================================

const RuleTypeSchema = z.enum(['path', 'subdomain', 'domain', 'method', 'header', 'parameter']);

const RuleSchema = z.object({
  description: z.string(),
  type: RuleTypeSchema,
  url_path: z.string(),
});

const RulesSchema = z.object({
  avoid: z.array(RuleSchema).optional(),
  focus: z.array(RuleSchema).optional(),
});

const LoginTypeSchema = z.enum(['form', 'sso', 'api', 'basic']);
const SuccessConditionTypeSchema = z.enum(['url', 'cookie', 'element', 'redirect']);

const CredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
  totp_secret: z.string().optional(),
});

const SuccessConditionSchema = z.object({
  type: SuccessConditionTypeSchema,
  value: z.string(),
});

const AuthenticationSchema = z.object({
  login_type: LoginTypeSchema,
  login_url: z.string(),
  credentials: CredentialsSchema,
  login_flow: z.array(z.string()),
  success_condition: SuccessConditionSchema.optional(),
});

/** Schema for config YAML files */
export const ConfigSchema = z.object({
  rules: RulesSchema.optional(),
  authentication: AuthenticationSchema.optional(),
}).passthrough();
export type Config = z.infer<typeof ConfigSchema>;

// ============================================
// LLM API Response Schemas
// ============================================

/** Schema for Anthropic API error response */
export const AnthropicErrorSchema = z.object({
  error: z.object({
    type: z.string().optional(),
    message: z.string(),
  }),
}).passthrough();

/** Schema for OpenAI API error response */
export const OpenAIErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string().optional(),
    code: z.string().nullable().optional(),
  }),
}).passthrough();

/** Schema for OpenRouter API error response */
export const OpenRouterErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.number().optional(),
  }).optional(),
}).passthrough();

// ============================================
// Validation Helpers
// ============================================

/**
 * Safely parse JSON and validate against a schema.
 * Returns null if parsing or validation fails.
 */
export function safeParseJson<T>(
  schema: z.ZodType<T>,
  data: string,
  context?: string
): T | null {
  try {
    const parsed = JSON.parse(data);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    console.warn(`Schema validation failed${context ? ` for ${context}` : ''}:`, result.error.issues);
    return null;
  } catch (error) {
    console.warn(`JSON parse failed${context ? ` for ${context}` : ''}:`, error);
    return null;
  }
}

/**
 * Validate data against a schema, returning the validated data or throwing.
 */
export function validateOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const message = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
  throw new Error(`Validation failed${context ? ` for ${context}` : ''}: ${message}`);
}

/**
 * Safely validate data against a schema.
 * Returns the data with defaults applied, or null if validation fails.
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string
): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn(`Validation failed${context ? ` for ${context}` : ''}:`, result.error.issues);
  return null;
}
