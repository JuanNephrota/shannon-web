import fs from 'fs/promises';
import path from 'path';

export interface ApiKeys {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openrouterApiKey?: string;
}

export interface Settings {
  apiKeys: ApiKeys;
  routerDefault?: string; // e.g., "openai,gpt-4o" or "openrouter,google/gemini-2.0-flash"
}

// Settings file path - stored in current working directory (not committed to git)
const SETTINGS_FILE = process.env.SETTINGS_FILE || path.join(process.cwd(), '.shannon-settings.json');

class SettingsService {
  private settings: Settings = {
    apiKeys: {},
  };
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf8');
      this.settings = JSON.parse(data);
      this.loaded = true;
      console.log('Loaded settings from', SETTINGS_FILE);
    } catch {
      // File doesn't exist or is invalid, use defaults
      // Also try to load from environment variables
      this.settings = {
        apiKeys: {
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          openaiApiKey: process.env.OPENAI_API_KEY,
          openrouterApiKey: process.env.OPENROUTER_API_KEY,
        },
        routerDefault: process.env.ROUTER_DEFAULT,
      };
      this.loaded = true;
    }
  }

  async save(): Promise<void> {
    try {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  getSettings(): Settings {
    return this.settings;
  }

  getApiKeys(): ApiKeys {
    return this.settings.apiKeys;
  }

  // Return masked keys for display (only show last 4 chars)
  getMaskedApiKeys(): Record<string, string | null> {
    const mask = (key?: string) => {
      if (!key) return null;
      if (key.length <= 8) return '****';
      return '****' + key.slice(-4);
    };

    return {
      anthropicApiKey: mask(this.settings.apiKeys.anthropicApiKey),
      openaiApiKey: mask(this.settings.apiKeys.openaiApiKey),
      openrouterApiKey: mask(this.settings.apiKeys.openrouterApiKey),
    };
  }

  async setApiKey(keyName: keyof ApiKeys, value: string | undefined): Promise<void> {
    this.settings.apiKeys[keyName] = value || undefined;
    await this.save();
  }

  async setApiKeys(keys: Partial<ApiKeys>): Promise<void> {
    // Only update keys that are provided (non-empty strings)
    if (keys.anthropicApiKey !== undefined) {
      this.settings.apiKeys.anthropicApiKey = keys.anthropicApiKey || undefined;
    }
    if (keys.openaiApiKey !== undefined) {
      this.settings.apiKeys.openaiApiKey = keys.openaiApiKey || undefined;
    }
    if (keys.openrouterApiKey !== undefined) {
      this.settings.apiKeys.openrouterApiKey = keys.openrouterApiKey || undefined;
    }
    await this.save();
  }

  async setRouterDefault(value: string | undefined): Promise<void> {
    this.settings.routerDefault = value || undefined;
    await this.save();
  }

  // Get environment variables to pass to worker process
  getWorkerEnv(): Record<string, string> {
    const env: Record<string, string> = {};

    if (this.settings.apiKeys.anthropicApiKey) {
      env.ANTHROPIC_API_KEY = this.settings.apiKeys.anthropicApiKey;
    }
    if (this.settings.apiKeys.openaiApiKey) {
      env.OPENAI_API_KEY = this.settings.apiKeys.openaiApiKey;
    }
    if (this.settings.apiKeys.openrouterApiKey) {
      env.OPENROUTER_API_KEY = this.settings.apiKeys.openrouterApiKey;
    }
    if (this.settings.routerDefault) {
      env.ROUTER_DEFAULT = this.settings.routerDefault;
    }

    return env;
  }

  hasAnthropicKey(): boolean {
    return !!this.settings.apiKeys.anthropicApiKey;
  }
}

export const settingsService = new SettingsService();
