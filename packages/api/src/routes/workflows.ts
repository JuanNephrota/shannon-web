import { Router, Request, Response } from 'express';
import { temporalService } from '../services/temporal.js';
import { auditService } from '../services/audit.js';
import { configService } from '../services/config.js';
import { workerService } from '../services/worker.js';
import { StartWorkflowSchema } from '../schemas/index.js';
import type {
  PipelineInput,
  PipelineProgress,
  WorkflowEvent,
} from '@shannon/shared';

const router: Router = Router();

// Start a new workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body against schema
    const parseResult = StartWorkflowSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
      return;
    }

    const { webUrl, repoPath, configName, outputPath, pipelineTestingMode } = parseResult.data;

    const input: PipelineInput = {
      webUrl,
      repoPath,
      outputPath,
      pipelineTestingMode: pipelineTestingMode === true,
    };

    // Resolve config path if config name provided
    if (configName) {
      input.configPath = configService.getConfigPath(configName);
    }

    const { workflowId } = await temporalService.startWorkflow(input);

    res.json({
      workflowId,
      status: 'started',
      monitorUrl: `/workflows/${workflowId}`,
    });
  } catch (error) {
    console.error('Failed to start workflow:', error);
    res.status(500).json({
      error: 'Failed to start workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// List all workflows
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Get workflows from Temporal
    const temporalWorkflows = await temporalService.listWorkflows();

    // Get sessions from audit logs for additional metadata
    const sessions = await auditService.listSessions();
    const sessionMap = new Map(sessions.map(s => [s.workflowId, s]));

    // Merge data
    const workflows = temporalWorkflows.map(tw => {
      const session = sessionMap.get(tw.workflowId);
      return {
        ...tw,
        webUrl: session?.targetUrl,
      };
    });

    // Also include sessions not in Temporal (historical)
    for (const session of sessions) {
      if (!temporalWorkflows.find(tw => tw.workflowId === session.workflowId)) {
        workflows.push({
          workflowId: session.workflowId,
          status: 'completed' as const,
          webUrl: session.targetUrl,
          startTime: session.createdAt ? new Date(session.createdAt).getTime() : Date.now(),
        });
      }
    }

    // Sort by start time descending
    workflows.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));

    res.json({ workflows });
  } catch (error) {
    console.error('Failed to list workflows:', error);
    res.status(500).json({
      error: 'Failed to list workflows',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get workflow progress
router.get('/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;

    const progress = await temporalService.getProgress(workflowId);
    const deliverables = await auditService.listDeliverables(workflowId);

    res.json({
      ...progress,
      hasDeliverables: deliverables.length > 0,
    });
  } catch (error) {
    console.error('Failed to get workflow progress:', error);

    // Try to get from audit logs if workflow is not running
    const session = await auditService.getSessionMetrics(req.params.workflowId);
    if (session) {
      res.json({
        workflowId: req.params.workflowId,
        status: 'completed',
        error: null,
        hasDeliverables: true,
      });
      return;
    }

    res.status(404).json({
      error: 'Workflow not found',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get workflow session metrics
router.get('/:workflowId/session', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const metrics = await auditService.getSessionMetrics(workflowId);

    if (!metrics) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(metrics);
  } catch (error) {
    console.error('Failed to get session metrics:', error);
    res.status(500).json({ error: 'Failed to get session metrics' });
  }
});

// ─────────────────────────────────────────────────────────────
// Live event stream (Server-Sent Events)
//
// Emits structured events by polling Temporal's progress query at 1.5s
// intervals and diffing against the previous snapshot. In parallel,
// forwards worker stdout/stderr lines as they arrive via workerService.
// Clients subscribe with EventSource; the connection closes when the
// workflow finishes or the client disconnects.
// ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 10_000;

router.get('/:workflowId/events', async (req: Request, res: Response) => {
  const { workflowId } = req.params;

  // SSE headers. Disable buffering and keep the socket open.
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event: WorkflowEvent) => {
    try {
      res.write(`event: ${event.kind}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // Socket torn down — ignore; cleanup runs on 'close'.
    }
  };

  // Defensive timeout wrapper: Temporal queries can hang indefinitely when
  // the workflow has no worker to respond (e.g., stuck in the task queue).
  // Cap any single progress query to 4s so the stream stays responsive.
  const PROGRESS_TIMEOUT_MS = 4000;
  const getProgressWithTimeout = async () => {
    return Promise.race([
      temporalService.getProgress(workflowId),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('temporal progress query timed out')),
          PROGRESS_TIMEOUT_MS
        )
      ),
    ]);
  };

  // ── Initial snapshot ────────────────────────────────────────
  //
  // Temporal only retains history for active + recently-finished workflows.
  // Archived runs will throw "workflow not found" — in that case we fall
  // back to audit-logs to construct a synthetic terminal snapshot so the
  // client can at least render the final state.
  let previous: PipelineProgress | null = null;
  try {
    previous = await getProgressWithTimeout();
  } catch {
    const session = await auditService.getSessionMetrics(workflowId);
    if (!session) {
      send({
        kind: 'error',
        ts: Date.now(),
        message: 'Workflow not in Temporal or audit-logs.',
      });
      res.end();
      return;
    }
    previous = {
      workflowId,
      status: 'completed',
      currentPhase: null,
      currentAgent: null,
      completedAgents: [],
      failedAgent: null,
      error: null,
      startTime: session.session.createdAt
        ? new Date(session.session.createdAt).getTime()
        : Date.now(),
      elapsedMs: session.metrics.total_duration_ms ?? 0,
      agentMetrics: {},
      summary: null,
    };
  }

  const recentLogs = workerService.getStatus().logs;
  send({
    kind: 'snapshot',
    ts: Date.now(),
    progress: previous,
    recentLogs,
  });

  // If the workflow is already terminal at attach time, skip polling —
  // emit `finished` with what we know and close.
  if (previous.status !== 'running') {
    const totalCost = Object.values(previous.agentMetrics).reduce(
      (s, m) => s + (m?.costUsd ?? 0),
      0
    );
    send({
      kind: 'finished',
      ts: Date.now(),
      status: previous.status,
      totalCostUsd: totalCost,
      totalDurationMs: previous.elapsedMs,
    });
    res.end();
    return;
  }

  // ── Forward worker log lines verbatim ───────────────────────
  const unsubscribeLogs = workerService.onLog((log) => {
    send({
      kind: 'log',
      ts: log.ts,
      stream: log.stream,
      line: log.line,
    });
  });

  // ── Poll Temporal and emit structured diff events ───────────
  let closed = false;
  const pollTick = async () => {
    if (closed) return;
    try {
      const current = await getProgressWithTimeout();
      const now = Date.now();

      // Phase change
      if (current.currentPhase !== previous?.currentPhase) {
        send({
          kind: 'phase-change',
          ts: now,
          from: previous?.currentPhase ?? null,
          to: current.currentPhase,
        });
      }

      // Agent started (current changed to non-null agent not already completed)
      if (
        current.currentAgent &&
        current.currentAgent !== previous?.currentAgent &&
        !(previous?.completedAgents ?? []).includes(current.currentAgent)
      ) {
        send({
          kind: 'agent-start',
          ts: now,
          agent: current.currentAgent,
          phase: current.currentPhase,
        });
      }

      // Newly completed agents
      const prevDone = new Set(previous?.completedAgents ?? []);
      for (const agent of current.completedAgents) {
        if (!prevDone.has(agent)) {
          const m = current.agentMetrics[agent];
          send({
            kind: 'agent-complete',
            ts: now,
            agent,
            durationMs: m?.durationMs ?? 0,
            costUsd: m?.costUsd ?? null,
          });
        }
      }

      // Agent failed
      if (
        current.failedAgent &&
        current.failedAgent !== previous?.failedAgent
      ) {
        send({
          kind: 'agent-failed',
          ts: now,
          agent: current.failedAgent,
          error: current.error,
        });
      }

      // Cost delta (summed agent costs)
      const prevCost = Object.values(previous?.agentMetrics ?? {}).reduce(
        (s, m) => s + (m?.costUsd ?? 0),
        0
      );
      const curCost = Object.values(current.agentMetrics).reduce(
        (s, m) => s + (m?.costUsd ?? 0),
        0
      );
      const delta = curCost - prevCost;
      if (delta > 0.0001) {
        send({ kind: 'cost-delta', ts: now, delta, total: curCost });
      }

      // Terminal state
      if (
        current.status !== 'running' &&
        previous?.status === 'running'
      ) {
        send({
          kind: 'finished',
          ts: now,
          status: current.status,
          totalCostUsd: curCost,
          totalDurationMs: current.elapsedMs,
        });
        cleanup();
        res.end();
        return;
      }

      previous = current;
    } catch (err) {
      send({
        kind: 'error',
        ts: Date.now(),
        message:
          err instanceof Error
            ? err.message
            : 'Failed to poll workflow progress',
      });
    }
  };

  const pollInterval = setInterval(pollTick, POLL_INTERVAL_MS);
  const heartbeatInterval = setInterval(
    () => send({ kind: 'heartbeat', ts: Date.now() }),
    HEARTBEAT_INTERVAL_MS
  );

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(pollInterval);
    clearInterval(heartbeatInterval);
    unsubscribeLogs();
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);
  res.on('close', cleanup);
});

// List deliverables
router.get('/:workflowId/deliverables', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const deliverables = await auditService.listDeliverables(workflowId);

    res.json({ deliverables });
  } catch (error) {
    console.error('Failed to list deliverables:', error);
    res.status(500).json({ error: 'Failed to list deliverables' });
  }
});

// Get deliverable content
router.get('/:workflowId/deliverables/*', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const filePath = req.params[0];

    const content = await auditService.getDeliverableContent(workflowId, filePath);

    if (content === null) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Determine content type
    if (filePath.endsWith('.md')) {
      res.type('text/markdown').send(content);
    } else if (filePath.endsWith('.json')) {
      res.type('application/json').send(content);
    } else {
      res.type('text/plain').send(content);
    }
  } catch (error) {
    console.error('Failed to get deliverable:', error);
    res.status(500).json({ error: 'Failed to get deliverable' });
  }
});

// Cancel workflow
router.post('/:workflowId/cancel', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    await temporalService.cancelWorkflow(workflowId);

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel workflow:', error);
    res.status(500).json({
      error: 'Failed to cancel workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
