import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { Config, ConfigSummary } from '@shannon/shared';

// Shannon project root - must be configured via environment variable
const SHANNON_ROOT = process.env.SHANNON_ROOT || path.resolve(process.cwd(), '..');

export class ConfigService {
  private configsDir: string;

  constructor(configsDir?: string) {
    this.configsDir = configsDir || process.env.CONFIGS_DIR || path.join(SHANNON_ROOT, 'configs');
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listConfigs(): Promise<ConfigSummary[]> {
    const configs: ConfigSummary[] = [];

    try {
      const files = await fs.readdir(this.configsDir);

      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          // Skip schema and example files
          if (file.includes('schema') || file === 'example-config.yaml') {
            continue;
          }

          const filePath = path.join(this.configsDir, file);
          const stat = await fs.stat(filePath);

          try {
            const content = await fs.readFile(filePath, 'utf8');
            const parsed = yaml.load(content) as Config;

            configs.push({
              name: file.replace(/\.(yaml|yml)$/, ''),
              path: file,
              hasAuthentication: !!parsed?.authentication,
              hasRules: !!(parsed?.rules?.avoid?.length || parsed?.rules?.focus?.length),
              lastModified: stat.mtime.toISOString(),
            });
          } catch {
            // Invalid YAML, skip
          }
        }
      }
    } catch (error) {
      console.error('Failed to list configs:', error);
    }

    return configs.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getConfig(name: string): Promise<{ config: Config; raw: string } | null> {
    const filePath = path.join(this.configsDir, `${name}.yaml`);

    if (!(await this.exists(filePath))) {
      // Try with .yml extension
      const ymlPath = path.join(this.configsDir, `${name}.yml`);
      if (!(await this.exists(ymlPath))) {
        return null;
      }
    }

    try {
      const actualPath = (await this.exists(path.join(this.configsDir, `${name}.yaml`)))
        ? path.join(this.configsDir, `${name}.yaml`)
        : path.join(this.configsDir, `${name}.yml`);

      const raw = await fs.readFile(actualPath, 'utf8');
      const config = yaml.load(raw) as Config;

      // Mask sensitive fields
      if (config?.authentication?.credentials) {
        config.authentication.credentials = {
          ...config.authentication.credentials,
          password: '********',
          totp_secret: config.authentication.credentials.totp_secret ? '********' : undefined,
        };
      }

      return { config, raw: this.maskYamlSecrets(raw) };
    } catch {
      return null;
    }
  }

  private maskYamlSecrets(yamlContent: string): string {
    return yamlContent
      .replace(/password:\s*['"]?[^'\n]+['"]?/g, 'password: "********"')
      .replace(/totp_secret:\s*['"]?[^'\n]+['"]?/g, 'totp_secret: "********"');
  }

  async saveConfig(name: string, content: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate YAML
      yaml.load(content);

      const filePath = path.join(this.configsDir, `${name}.yaml`);
      await fs.writeFile(filePath, content, 'utf8');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteConfig(name: string): Promise<boolean> {
    const filePath = path.join(this.configsDir, `${name}.yaml`);

    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      // Try .yml
      try {
        await fs.unlink(path.join(this.configsDir, `${name}.yml`));
        return true;
      } catch {
        return false;
      }
    }
  }

  getConfigPath(name: string): string {
    return path.join(this.configsDir, `${name}.yaml`);
  }
}

export const configService = new ConfigService();
