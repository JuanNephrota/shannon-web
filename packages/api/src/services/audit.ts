import fs from 'fs/promises';
import path from 'path';
import type { Deliverable } from '@shannon/shared';

// Shannon project root - must be configured via environment variable
const SHANNON_ROOT = process.env.SHANNON_ROOT || path.resolve(process.cwd(), '..');

export interface SessionMetrics {
  session: {
    id: string;
    createdAt: string;
    targetUrl: string;
  };
  metrics: {
    total_duration_ms: number;
    total_cost_usd: number;
    total_input_tokens: number;
    total_output_tokens: number;
  };
  agents: Record<string, unknown>;
}

export class AuditService {
  private auditLogsDir: string;

  constructor(auditLogsDir?: string) {
    this.auditLogsDir = auditLogsDir || process.env.AUDIT_LOGS_DIR || path.join(SHANNON_ROOT, 'audit-logs');
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listSessions(): Promise<Array<{ workflowId: string; targetUrl?: string; createdAt?: string; metrics?: { totalDuration: number; totalCost: number } }>> {
    const sessions: Array<{ workflowId: string; targetUrl?: string; createdAt?: string; metrics?: { totalDuration: number; totalCost: number } }> = [];

    try {
      const entries = await fs.readdir(this.auditLogsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== '.gitkeep') {
          const sessionPath = path.join(this.auditLogsDir, entry.name);
          const sessionJsonPath = path.join(sessionPath, 'session.json');

          try {
            const data = JSON.parse(await fs.readFile(sessionJsonPath, 'utf8')) as SessionMetrics;
            sessions.push({
              workflowId: entry.name,
              targetUrl: data.session?.targetUrl,
              createdAt: data.session?.createdAt,
              metrics: {
                totalDuration: data.metrics?.total_duration_ms || 0,
                totalCost: data.metrics?.total_cost_usd || 0,
              },
            });
          } catch {
            // Session.json may not exist yet for running workflows
            sessions.push({ workflowId: entry.name });
          }
        }
      }
    } catch (error) {
      console.error('Failed to list sessions:', error);
    }

    return sessions.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getSessionMetrics(workflowId: string): Promise<SessionMetrics | null> {
    const sessionPath = path.join(this.auditLogsDir, workflowId, 'session.json');

    try {
      const data = await fs.readFile(sessionPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async listDeliverables(workflowId: string): Promise<Deliverable[]> {
    const sessionPath = path.join(this.auditLogsDir, workflowId);
    const deliverables: Deliverable[] = [];

    // Check for deliverables directory
    const deliverablesPath = path.join(sessionPath, 'deliverables');
    if (await this.exists(deliverablesPath)) {
      try {
        const files = await fs.readdir(deliverablesPath);
        for (const file of files) {
          const filePath = path.join(deliverablesPath, file);
          const stat = await fs.stat(filePath);
          deliverables.push({
            name: file,
            path: `deliverables/${file}`,
            size: stat.size,
            type: 'report',
          });
        }
      } catch (error) {
        console.error('Failed to list deliverables:', error);
      }
    }

    // Check for agent logs
    const agentsPath = path.join(sessionPath, 'agents');
    if (await this.exists(agentsPath)) {
      try {
        const files = await fs.readdir(agentsPath);
        for (const file of files) {
          const filePath = path.join(agentsPath, file);
          const stat = await fs.stat(filePath);
          deliverables.push({
            name: file,
            path: `agents/${file}`,
            size: stat.size,
            type: 'log',
          });
        }
      } catch (error) {
        console.error('Failed to list agent logs:', error);
      }
    }

    // Check for prompts
    const promptsPath = path.join(sessionPath, 'prompts');
    if (await this.exists(promptsPath)) {
      try {
        const files = await fs.readdir(promptsPath);
        for (const file of files) {
          const filePath = path.join(promptsPath, file);
          const stat = await fs.stat(filePath);
          deliverables.push({
            name: file,
            path: `prompts/${file}`,
            size: stat.size,
            type: 'prompt',
          });
        }
      } catch (error) {
        console.error('Failed to list prompts:', error);
      }
    }

    return deliverables;
  }

  async getDeliverableContent(workflowId: string, filePath: string): Promise<string | null> {
    // Prevent path traversal
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes('..')) {
      return null;
    }

    const fullPath = path.join(this.auditLogsDir, workflowId, normalizedPath);

    try {
      return await fs.readFile(fullPath, 'utf8');
    } catch {
      return null;
    }
  }
}

export const auditService = new AuditService();
