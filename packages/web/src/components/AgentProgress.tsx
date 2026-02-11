import { AGENT_ORDER, AGENT_PHASE_MAP, AGENTS } from '@shannon/shared';
import type { AgentMetrics } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentProgressProps {
  completedAgents: string[];
  currentAgent: string | null;
  failedAgent: string | null;
  agentMetrics: Record<string, AgentMetrics>;
}

const phaseLabels: Record<string, string> = {
  'pre-recon': 'Pre-Reconnaissance',
  'recon': 'Reconnaissance',
  'vulnerability-analysis': 'Vulnerability Analysis',
  'exploitation': 'Exploitation',
  'reporting': 'Reporting',
};

export default function AgentProgress({
  completedAgents,
  currentAgent,
  failedAgent,
  agentMetrics,
}: AgentProgressProps) {
  // Group agents by phase
  const phases = ['pre-recon', 'recon', 'vulnerability-analysis', 'exploitation', 'reporting'] as const;

  const agentsByPhase = phases.map((phase) => ({
    phase,
    label: phaseLabels[phase],
    agents: AGENT_ORDER.filter((agent) => AGENT_PHASE_MAP[agent] === phase),
  }));

  const getAgentStatus = (agent: string) => {
    if (failedAgent === agent) return 'failed';
    if (completedAgents.includes(agent)) return 'completed';
    if (currentAgent === agent) return 'running';
    return 'pending';
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatCost = (cost: number | null) => {
    if (cost === null) return '-';
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className="space-y-6">
      {agentsByPhase.map(({ phase, label, agents }) => (
        <Card key={phase}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "grid gap-3",
              phase === 'vulnerability-analysis' || phase === 'exploitation'
                ? 'grid-cols-5'
                : 'grid-cols-1'
            )}>
              {agents.map((agent) => {
                const status = getAgentStatus(agent);
                const metrics = agentMetrics[agent];
                const definition = AGENTS[agent];

                return (
                  <div
                    key={agent}
                    className={cn(
                      "p-3 rounded-lg border",
                      status === 'running' && "border-blue-300 bg-blue-50 dark:bg-blue-950/50",
                      status === 'completed' && "border-green-200 bg-green-50 dark:bg-green-950/50",
                      status === 'failed' && "border-destructive/50 bg-destructive/10",
                      status === 'pending' && "border-border bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {status === 'running' && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
                      {status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                      {status === 'pending' && <Circle className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium truncate" title={definition.displayName}>
                        {agent.replace('-vuln', '').replace('-exploit', '').replace('pre-', 'Pre-')}
                      </span>
                    </div>

                    {metrics && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{formatDuration(metrics.durationMs)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span>{formatCost(metrics.costUsd)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
