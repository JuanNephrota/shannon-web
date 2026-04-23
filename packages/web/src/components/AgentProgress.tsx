import { AGENT_ORDER, AGENT_PHASE_MAP, AGENTS } from '@shannon/shared';
import type { AgentMetrics } from '@/api/client';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentProgressProps {
  completedAgents: string[];
  currentAgent: string | null;
  failedAgent: string | null;
  agentMetrics: Record<string, AgentMetrics>;
}

const PHASES = [
  { key: 'pre-recon', code: 'P1', label: 'Pre‑Recon' },
  { key: 'recon', code: 'P2', label: 'Reconnaissance' },
  { key: 'vulnerability-analysis', code: 'P3', label: 'Vuln Analysis' },
  { key: 'exploitation', code: 'P4', label: 'Exploitation' },
  { key: 'reporting', code: 'P5', label: 'Reporting' },
] as const;

type AgentStatus = 'completed' | 'running' | 'failed' | 'pending';

export default function AgentProgress({
  completedAgents,
  currentAgent,
  failedAgent,
  agentMetrics,
}: AgentProgressProps) {
  const getStatus = (agent: string): AgentStatus => {
    if (failedAgent === agent) return 'failed';
    if (completedAgents.includes(agent)) return 'completed';
    if (currentAgent === agent) return 'running';
    return 'pending';
  };

  const groups = PHASES.map((p) => ({
    ...p,
    agents: AGENT_ORDER.filter((a) => AGENT_PHASE_MAP[a] === p.key),
  }));

  const fmtDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  return (
    <div className="space-y-4">
      {groups.map(({ key, code, label, agents }) => {
        const done = agents.filter((a) => getStatus(a) === 'completed').length;
        const running = agents.some((a) => getStatus(a) === 'running');
        const failed = agents.some((a) => getStatus(a) === 'failed');

        return (
          <section key={key} className="border border-border bg-card">
            <header className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-7 w-7 border flex items-center justify-center font-mono text-[10px] font-semibold tracking-[0.1em]',
                    failed
                      ? 'border-alert-500/50 bg-alert-500/10 text-alert-400'
                      : running
                        ? 'border-signal-400/60 bg-signal-400/10 text-signal-300'
                        : done === agents.length && agents.length > 0
                          ? 'border-go-500/40 bg-go-500/10 text-go-400'
                          : 'border-ink-400 text-paper-500'
                  )}
                >
                  {code}
                </span>
                <div>
                  <div className="label-stamp mb-0.5">// Phase</div>
                  <h3 className="font-display text-[1.05rem] text-paper-0 leading-none">
                    {label}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 tabular-nums">
                {running && (
                  <span className="flex items-center gap-1.5 text-signal-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-signal-pulse" />
                    Running
                  </span>
                )}
                <span>
                  {done}
                  <span className="text-ink-700">/</span>
                  {agents.length}
                </span>
              </div>
            </header>

            <div
              className={cn(
                'p-4 grid gap-2',
                key === 'vulnerability-analysis' || key === 'exploitation'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
                  : 'grid-cols-1 sm:grid-cols-2'
              )}
            >
              {agents.map((agent) => {
                const status = getStatus(agent);
                const metrics = agentMetrics[agent];
                const def = AGENTS[agent];

                return (
                  <AgentTile
                    key={agent}
                    agent={agent}
                    display={def.displayName}
                    status={status}
                    duration={metrics ? fmtDuration(metrics.durationMs) : null}
                    cost={metrics?.costUsd ?? null}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AgentTile({
  agent,
  display,
  status,
  duration,
  cost,
}: {
  agent: string;
  display: string;
  status: AgentStatus;
  duration: string | null;
  cost: number | null;
}) {
  const short = agent.replace('-vuln', '').replace('-exploit', '');

  const toneClass = {
    completed: 'border-go-500/30 bg-go-500/[0.06]',
    running: 'border-signal-400/60 bg-signal-400/10',
    failed: 'border-alert-500/50 bg-alert-500/[0.06]',
    pending: 'border-ink-400 bg-transparent',
  }[status];

  const iconClass = {
    completed: 'text-go-400',
    running: 'text-signal-400',
    failed: 'text-alert-400',
    pending: 'text-ink-700',
  }[status];

  return (
    <div
      className={cn(
        'relative px-3 py-2.5 border transition-colors',
        toneClass
      )}
      title={display}
    >
      <div className="flex items-center gap-2">
        {status === 'completed' && (
          <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', iconClass)} />
        )}
        {status === 'running' && (
          <Loader2 className={cn('h-3.5 w-3.5 shrink-0 animate-spin', iconClass)} />
        )}
        {status === 'failed' && (
          <XCircle className={cn('h-3.5 w-3.5 shrink-0', iconClass)} />
        )}
        {status === 'pending' && (
          <Circle className={cn('h-3.5 w-3.5 shrink-0', iconClass)} />
        )}
        <span
          className={cn(
            'font-mono text-[11px] tracking-tight truncate',
            status === 'pending' ? 'text-paper-500' : 'text-paper-0'
          )}
        >
          {short}
        </span>
      </div>

      {duration && (
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-paper-500">
          <span className="tabular-nums">{duration}</span>
          <span className="tabular-nums">
            {cost != null ? `$${cost.toFixed(4)}` : '—'}
          </span>
        </div>
      )}
    </div>
  );
}
