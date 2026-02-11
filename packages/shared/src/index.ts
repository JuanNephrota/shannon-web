// Pipeline types (from src/temporal/shared.ts)
export interface PipelineInput {
  webUrl: string;
  repoPath: string;
  configPath?: string;
  outputPath?: string;
  pipelineTestingMode?: boolean;
  workflowId?: string;
}

export interface AgentMetrics {
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  numTurns: number | null;
  model?: string | undefined;
}

export interface PipelineSummary {
  totalCostUsd: number;
  totalDurationMs: number;
  totalTurns: number;
  agentCount: number;
}

export interface PipelineState {
  status: 'running' | 'completed' | 'failed';
  currentPhase: string | null;
  currentAgent: string | null;
  completedAgents: string[];
  failedAgent: string | null;
  error: string | null;
  startTime: number;
  agentMetrics: Record<string, AgentMetrics>;
  summary: PipelineSummary | null;
}

export interface PipelineProgress extends PipelineState {
  workflowId: string;
  elapsedMs: number;
}

// Agent types
export type AgentName =
  | 'pre-recon'
  | 'recon'
  | 'injection-vuln'
  | 'xss-vuln'
  | 'auth-vuln'
  | 'ssrf-vuln'
  | 'authz-vuln'
  | 'injection-exploit'
  | 'xss-exploit'
  | 'auth-exploit'
  | 'ssrf-exploit'
  | 'authz-exploit'
  | 'report';

export type PhaseName = 'pre-recon' | 'recon' | 'vulnerability-analysis' | 'exploitation' | 'reporting';

export interface AgentDefinition {
  name: AgentName;
  displayName: string;
  prerequisites: AgentName[];
}

// Agent constants
export const AGENTS: Readonly<Record<AgentName, AgentDefinition>> = {
  'pre-recon': { name: 'pre-recon', displayName: 'Pre-recon agent', prerequisites: [] },
  'recon': { name: 'recon', displayName: 'Recon agent', prerequisites: ['pre-recon'] },
  'injection-vuln': { name: 'injection-vuln', displayName: 'Injection vuln agent', prerequisites: ['recon'] },
  'xss-vuln': { name: 'xss-vuln', displayName: 'XSS vuln agent', prerequisites: ['recon'] },
  'auth-vuln': { name: 'auth-vuln', displayName: 'Auth vuln agent', prerequisites: ['recon'] },
  'ssrf-vuln': { name: 'ssrf-vuln', displayName: 'SSRF vuln agent', prerequisites: ['recon'] },
  'authz-vuln': { name: 'authz-vuln', displayName: 'Authz vuln agent', prerequisites: ['recon'] },
  'injection-exploit': { name: 'injection-exploit', displayName: 'Injection exploit agent', prerequisites: ['injection-vuln'] },
  'xss-exploit': { name: 'xss-exploit', displayName: 'XSS exploit agent', prerequisites: ['xss-vuln'] },
  'auth-exploit': { name: 'auth-exploit', displayName: 'Auth exploit agent', prerequisites: ['auth-vuln'] },
  'ssrf-exploit': { name: 'ssrf-exploit', displayName: 'SSRF exploit agent', prerequisites: ['ssrf-vuln'] },
  'authz-exploit': { name: 'authz-exploit', displayName: 'Authz exploit agent', prerequisites: ['authz-vuln'] },
  'report': { name: 'report', displayName: 'Report agent', prerequisites: ['injection-exploit', 'xss-exploit', 'auth-exploit', 'ssrf-exploit', 'authz-exploit'] }
};

export const AGENT_ORDER: readonly AgentName[] = [
  'pre-recon', 'recon',
  'injection-vuln', 'xss-vuln', 'auth-vuln', 'ssrf-vuln', 'authz-vuln',
  'injection-exploit', 'xss-exploit', 'auth-exploit', 'ssrf-exploit', 'authz-exploit',
  'report'
];

export const AGENT_PHASE_MAP: Readonly<Record<AgentName, PhaseName>> = {
  'pre-recon': 'pre-recon',
  'recon': 'recon',
  'injection-vuln': 'vulnerability-analysis',
  'xss-vuln': 'vulnerability-analysis',
  'auth-vuln': 'vulnerability-analysis',
  'authz-vuln': 'vulnerability-analysis',
  'ssrf-vuln': 'vulnerability-analysis',
  'injection-exploit': 'exploitation',
  'xss-exploit': 'exploitation',
  'auth-exploit': 'exploitation',
  'authz-exploit': 'exploitation',
  'ssrf-exploit': 'exploitation',
  'report': 'reporting',
};

export const PARALLEL_GROUPS = {
  vuln: ['injection-vuln', 'xss-vuln', 'auth-vuln', 'ssrf-vuln', 'authz-vuln'] as AgentName[],
  exploit: ['injection-exploit', 'xss-exploit', 'auth-exploit', 'ssrf-exploit', 'authz-exploit'] as AgentName[]
};

// Config types (from src/types/config.ts)
export type RuleType = 'path' | 'subdomain' | 'domain' | 'method' | 'header' | 'parameter';
export type LoginType = 'form' | 'sso' | 'api' | 'basic';
export type SuccessConditionType = 'url' | 'cookie' | 'element' | 'redirect';

export interface Rule {
  description: string;
  type: RuleType;
  url_path: string;
}

export interface Rules {
  avoid?: Rule[];
  focus?: Rule[];
}

export interface SuccessCondition {
  type: SuccessConditionType;
  value: string;
}

export interface Credentials {
  username: string;
  password: string;
  totp_secret?: string;
}

export interface Authentication {
  login_type: LoginType;
  login_url: string;
  credentials: Credentials;
  login_flow: string[];
  success_condition: SuccessCondition;
}

export interface Config {
  rules?: Rules;
  authentication?: Authentication;
}

// API response types
export interface WorkflowListItem {
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'unknown';
  webUrl?: string;
  startTime: number;
  endTime?: number;
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
