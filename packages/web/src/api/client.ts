const API_BASE = '/api';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // Include cookies for session auth
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  // Handle authentication errors
  if (response.status === 401) {
    // Redirect to login page on auth failure
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Workflows
  listWorkflows: () => fetchApi<{ workflows: WorkflowListItem[] }>('/workflows'),

  startWorkflow: (data: StartWorkflowInput) =>
    fetchApi<{ workflowId: string; status: string }>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getWorkflow: (workflowId: string) =>
    fetchApi<WorkflowProgress>(`/workflows/${workflowId}`),

  getWorkflowSession: (workflowId: string) =>
    fetchApi<SessionMetrics>(`/workflows/${workflowId}/session`),

  listDeliverables: (workflowId: string) =>
    fetchApi<{ deliverables: Deliverable[] }>(`/workflows/${workflowId}/deliverables`),

  getDeliverable: async (workflowId: string, filePath: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/workflows/${workflowId}/deliverables/${filePath}`, {
      credentials: 'include',
    });
    if (response.status === 401) {
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    if (!response.ok) throw new Error('Failed to fetch deliverable');
    return response.text();
  },

  cancelWorkflow: (workflowId: string) =>
    fetchApi<{ success: boolean }>(`/workflows/${workflowId}/cancel`, { method: 'POST' }),

  // Configs
  listConfigs: () => fetchApi<{ configs: ConfigSummary[] }>('/configs'),

  getConfig: (name: string) =>
    fetchApi<{ name: string; config: Config; raw: string }>(`/configs/${name}`),

  saveConfig: (name: string, content: string) =>
    fetchApi<{ success: boolean }>(`/configs/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  deleteConfig: (name: string) =>
    fetchApi<{ success: boolean }>(`/configs/${name}`, { method: 'DELETE' }),

  // Worker
  getWorkerStatus: () => fetchApi<WorkerStatus>('/worker/status'),

  startWorker: () =>
    fetchApi<{ success: boolean; status: WorkerStatus }>('/worker/start', { method: 'POST' }),

  stopWorker: () =>
    fetchApi<{ success: boolean }>('/worker/stop', { method: 'POST' }),

  getWorkerLogs: () => fetchApi<{ logs: string[] }>('/worker/logs'),

  // Settings
  getSettings: () => fetchApi<SettingsResponse>('/settings'),

  updateApiKeys: (keys: ApiKeysInput) =>
    fetchApi<{ success: boolean; apiKeys: MaskedApiKeys }>('/settings/api-keys', {
      method: 'PUT',
      body: JSON.stringify(keys),
    }),

  updateRouterDefault: (routerDefault: string | null) =>
    fetchApi<{ success: boolean }>('/settings/router', {
      method: 'PUT',
      body: JSON.stringify({ routerDefault }),
    }),

  testApiKey: (provider: string, apiKey: string) =>
    fetchApi<{ valid: boolean; error: string | null }>('/settings/test-key', {
      method: 'POST',
      body: JSON.stringify({ provider, apiKey }),
    }),
};

// Types
export interface WorkflowListItem {
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'unknown';
  webUrl?: string;
  startTime: number;
  endTime?: number;
}

export interface StartWorkflowInput {
  webUrl: string;
  repoPath: string;
  configName?: string;
  outputPath?: string;
  pipelineTestingMode?: boolean;
}

export interface WorkflowProgress {
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  currentPhase: string | null;
  currentAgent: string | null;
  completedAgents: string[];
  failedAgent: string | null;
  error: string | null;
  startTime: number;
  elapsedMs: number;
  agentMetrics: Record<string, AgentMetrics>;
  summary: PipelineSummary | null;
  hasDeliverables?: boolean;
}

export interface AgentMetrics {
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  numTurns: number | null;
  model?: string;
}

export interface PipelineSummary {
  totalCostUsd: number;
  totalDurationMs: number;
  totalTurns: number;
  agentCount: number;
}

export interface SessionMetrics {
  session: { id: string; createdAt: string; targetUrl: string };
  metrics: {
    total_duration_ms: number;
    total_cost_usd: number;
    total_input_tokens: number;
    total_output_tokens: number;
  };
}

export interface Deliverable {
  name: string;
  path: string;
  size: number;
  type: 'report' | 'log' | 'prompt';
}

export interface ConfigSummary {
  name: string;
  path: string;
  hasAuthentication: boolean;
  hasRules: boolean;
  lastModified: string;
}

export interface Config {
  rules?: {
    avoid?: Array<{ description: string; type: string; url_path: string }>;
    focus?: Array<{ description: string; type: string; url_path: string }>;
  };
  authentication?: {
    login_type: string;
    login_url: string;
    credentials: { username: string; password: string };
    login_flow: string[];
  };
}

export interface WorkerStatus {
  running: boolean;
  pid: number | null;
  startedAt: string | null;
  logs: string[];
}

export interface MaskedApiKeys {
  anthropicApiKey: string | null;
  openaiApiKey: string | null;
  openrouterApiKey: string | null;
}

export interface SettingsResponse {
  apiKeys: MaskedApiKeys;
  routerDefault: string | null;
  hasAnthropicKey: boolean;
}

export interface ApiKeysInput {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openrouterApiKey?: string;
}
