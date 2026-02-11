import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { settingsService } from './settings.js';

// Shannon project root - must be configured via environment variable
const SHANNON_ROOT = process.env.SHANNON_ROOT || path.resolve(process.cwd(), '..');

export interface WorkerStatus {
  running: boolean;
  pid: number | null;
  startedAt: string | null;
  logs: string[];
}

class WorkerService {
  private process: ChildProcess | null = null;
  private startedAt: string | null = null;
  private logs: string[] = [];
  private maxLogs = 100;

  private addLog(message: string) {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getStatus(): WorkerStatus {
    return {
      running: this.process !== null && this.process.exitCode === null,
      pid: this.process?.pid || null,
      startedAt: this.startedAt,
      logs: this.logs.slice(-20), // Return last 20 logs
    };
  }

  async start(): Promise<{ success: boolean; error?: string }> {
    if (this.process && this.process.exitCode === null) {
      return { success: false, error: 'Worker is already running' };
    }

    // Path to the worker script in Shannon project
    const workerPath = path.join(SHANNON_ROOT, 'dist/temporal/worker.js');

    try {
      this.logs = [];
      this.addLog('Starting Temporal worker...');

      // Get API keys from settings
      const workerEnv = settingsService.getWorkerEnv();

      // Use the same node binary that's running this process
      const nodePath = process.execPath;
      const nodeDir = path.dirname(nodePath);

      // Build PATH that includes node's directory and common tool locations
      // This ensures Claude Code CLI can find node when spawning subprocesses
      const basePath = process.env.PATH || '';
      const additionalPaths = [
        nodeDir, // Directory containing the node binary we're using
        '/opt/homebrew/bin', // Homebrew on Apple Silicon
        '/usr/local/bin', // Homebrew on Intel Mac / common tools
        '/usr/bin',
        '/bin',
      ];
      const fullPath = [...additionalPaths, basePath].filter(Boolean).join(':');

      this.addLog(`Using node: ${nodePath}`);
      this.addLog(`PATH includes: ${nodeDir}`);

      this.process = spawn(nodePath, [workerPath], {
        cwd: SHANNON_ROOT,
        env: {
          ...process.env,
          ...workerEnv,
          TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
          PATH: fullPath,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.startedAt = new Date().toISOString();

      this.process.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => this.addLog(`[stdout] ${line}`));
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => this.addLog(`[stderr] ${line}`));
      });

      this.process.on('error', (error) => {
        this.addLog(`Worker error: ${error.message}`);
      });

      this.process.on('exit', (code, signal) => {
        this.addLog(`Worker exited with code ${code}, signal ${signal}`);
        this.process = null;
        this.startedAt = null;
      });

      // Wait a moment to check if the process started successfully
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (this.process.exitCode !== null) {
        return { success: false, error: 'Worker failed to start - check logs' };
      }

      this.addLog(`Worker started with PID ${this.process.pid}`);
      return { success: true };
    } catch (error) {
      this.addLog(`Failed to start worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start worker',
      };
    }
  }

  async stop(): Promise<{ success: boolean; error?: string }> {
    if (!this.process || this.process.exitCode !== null) {
      return { success: false, error: 'Worker is not running' };
    }

    try {
      this.addLog('Stopping worker...');

      // Send SIGTERM for graceful shutdown
      this.process.kill('SIGTERM');

      // Wait up to 5 seconds for graceful shutdown
      const timeout = setTimeout(() => {
        if (this.process && this.process.exitCode === null) {
          this.addLog('Worker did not stop gracefully, sending SIGKILL');
          this.process.kill('SIGKILL');
        }
      }, 5000);

      await new Promise<void>((resolve) => {
        if (!this.process) {
          resolve();
          return;
        }

        this.process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.addLog('Worker stopped');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop worker',
      };
    }
  }
}

export const workerService = new WorkerService();
