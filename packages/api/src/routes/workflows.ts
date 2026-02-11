import { Router, Request, Response } from 'express';
import { temporalService } from '../services/temporal.js';
import { auditService } from '../services/audit.js';
import { configService } from '../services/config.js';
import type { PipelineInput } from '@shannon/shared';

const router: Router = Router();

// Start a new workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const { webUrl, repoPath, configName, outputPath, pipelineTestingMode } = req.body;

    if (!webUrl || !repoPath) {
      res.status(400).json({ error: 'webUrl and repoPath are required' });
      return;
    }

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
