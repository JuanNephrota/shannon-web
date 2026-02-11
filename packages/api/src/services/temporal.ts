import { Connection, Client } from '@temporalio/client';
import type { PipelineInput, PipelineProgress, WorkflowListItem } from '@shannon/shared';

const TASK_QUEUE = 'shannon-pipeline';
const WORKFLOW_TYPE = 'pentestPipelineWorkflow';
const PROGRESS_QUERY = 'getProgress';

export class TemporalService {
  private client: Client | null = null;
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.client) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = this.doConnect();
    return this.connectionPromise;
  }

  private async doConnect(): Promise<void> {
    const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
    console.log(`Connecting to Temporal at ${address}...`);

    try {
      const connection = await Connection.connect({ address });
      this.client = new Client({ connection });
      console.log('Connected to Temporal');
    } catch (error) {
      console.error('Failed to connect to Temporal:', error);
      throw error;
    }
  }

  private getClient(): Client {
    if (!this.client) {
      throw new Error('Temporal client not connected. Call connect() first.');
    }
    return this.client;
  }

  sanitizeHostname(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/[^a-zA-Z0-9-]/g, '-');
    } catch {
      return 'unknown';
    }
  }

  async startWorkflow(input: PipelineInput): Promise<{ workflowId: string }> {
    const client = this.getClient();

    const hostname = this.sanitizeHostname(input.webUrl);
    const workflowId = input.workflowId || `${hostname}_shannon-${Date.now()}`;

    const fullInput: PipelineInput = {
      ...input,
      workflowId,
    };

    await client.workflow.start(WORKFLOW_TYPE, {
      taskQueue: TASK_QUEUE,
      workflowId,
      args: [fullInput],
    });

    return { workflowId };
  }

  async getProgress(workflowId: string): Promise<PipelineProgress> {
    const client = this.getClient();
    const handle = client.workflow.getHandle(workflowId);
    return handle.query<PipelineProgress>(PROGRESS_QUERY);
  }

  async listWorkflows(): Promise<WorkflowListItem[]> {
    const client = this.getClient();

    try {
      const workflows: WorkflowListItem[] = [];

      for await (const workflow of client.workflow.list({
        query: `WorkflowType = "${WORKFLOW_TYPE}"`,
      })) {
        const startTime = workflow.startTime?.getTime() ?? Date.now();

        let status: WorkflowListItem['status'] = 'unknown';
        const statusName = workflow.status.name;
        if (statusName === 'RUNNING') status = 'running';
        else if (statusName === 'COMPLETED') status = 'completed';
        else if (statusName === 'FAILED' || statusName === 'TERMINATED' || statusName === 'CANCELLED') {
          status = 'failed';
        }

        workflows.push({
          workflowId: workflow.workflowId,
          status,
          startTime,
          endTime: workflow.closeTime?.getTime(),
        });
      }

      return workflows;
    } catch (error) {
      console.error('Failed to list workflows:', error);
      return [];
    }
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    const client = this.getClient();
    const handle = client.workflow.getHandle(workflowId);
    await handle.cancel();
  }
}

export const temporalService = new TemporalService();
