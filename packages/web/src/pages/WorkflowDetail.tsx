import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Cpu,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  FileDigit,
  FileCode2,
  Fingerprint,
  Gauge,
  ScrollText,
  Sigma,
  XOctagon,
  XCircle,
} from 'lucide-react';
import {
  useWorkflow,
  useDeliverables,
  useCancelWorkflow,
  useWorkflowSession,
} from '@/api/hooks';
import StatusBadge from '@/components/StatusBadge';
import AgentProgress from '@/components/AgentProgress';
import LiveFeed from '@/components/LiveFeed';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Deliverable } from '@/api/client';
import { cn } from '@/lib/utils';

/* ─────────────────────── helpers ─────────────────────── */

function fmtDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function fmtCost(cost: number | null | undefined): string {
  if (cost == null) return '—';
  return `$${cost.toFixed(4)}`;
}

function fmtNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US');
}

function fmtTimestamp(ts?: number | string | null): string {
  if (ts == null) return '—';
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toISOString().slice(0, 10)} · ${d.toISOString().slice(11, 19)}Z`;
}

/* ─────────────────────── component ─────────────────────── */

export default function WorkflowDetail() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { data: workflow, isLoading, error } = useWorkflow(workflowId);
  const { data: deliverablesData } = useDeliverables(workflowId);
  const { data: sessionData } = useWorkflowSession(workflowId);
  const cancelWorkflow = useCancelWorkflow();

  const deliverables = deliverablesData?.deliverables ?? [];

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-4 gap-px bg-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  /* ── error / not found ── */
  if (error || !workflow) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center">
        <div className="label-stamp text-alert-400 mb-4">// 404 · Not Found</div>
        <h2 className="font-display text-3xl font-medium text-paper-0 leading-tight">
          Operation not in registry.
        </h2>
        <p className="mt-3 font-mono text-[12px] text-paper-500">
          The workflow may have been deleted or the ID is invalid.
        </p>
        <Button asChild variant="outline" size="lg" className="mt-8">
          <Link to="/workflows">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Link>
        </Button>
      </div>
    );
  }

  const isRunning = workflow.status === 'running';
  const isFailed = workflow.status === 'failed';

  // Prefer session metrics (covers completed runs); fall back to live agentMetrics sum.
  const liveCost = Object.values(workflow.agentMetrics ?? {}).reduce(
    (sum, m) => sum + (m.costUsd ?? 0),
    0
  );
  const totalCost = sessionData?.metrics?.total_cost_usd ?? liveCost;
  const totalDuration =
    sessionData?.metrics?.total_duration_ms ?? workflow.elapsedMs ?? 0;
  const inputTokens = sessionData?.metrics?.total_input_tokens ?? null;
  const outputTokens = sessionData?.metrics?.total_output_tokens ?? null;

  const completedAgents = workflow.completedAgents ?? [];
  const agentMetrics = workflow.agentMetrics ?? {};

  const reports = deliverables.filter((d) => d.type === 'report');
  const logs = deliverables.filter((d) => d.type === 'log');
  const prompts = deliverables.filter((d) => d.type === 'prompt');

  const handleCancel = async () => {
    if (!workflowId) return;
    if (!confirm('Abort this operation?')) return;
    try {
      await cancelWorkflow.mutateAsync(workflowId);
    } catch (err) {
      console.error('Failed to cancel workflow:', err);
    }
  };

  return (
    <div className="space-y-10">
      {/* ─────────── Header ─────────── */}
      <header className="space-y-5">
        <Link
          to="/workflows"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 hover:text-signal-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Workflows
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="label-stamp-signal flex items-center gap-2">
                <Fingerprint className="h-3 w-3" />
                // Operation
              </div>
              <StatusBadge status={workflow.status} />
              {workflow.currentPhase && isRunning && (
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-400">
                  <span className="text-ink-700">phase</span>{' '}
                  <span className="text-paper-0">{workflow.currentPhase}</span>
                </span>
              )}
            </div>
            <h1 className="font-mono text-[18px] md:text-[20px] text-paper-0 tracking-tight leading-snug break-all">
              {workflow.workflowId}
            </h1>
            {sessionData?.session?.createdAt && (
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-paper-500">
                <span className="text-ink-700">started</span>{' '}
                <span className="tabular-nums text-paper-400">
                  {fmtTimestamp(sessionData.session.createdAt)}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="lg" asChild>
              <a
                href={`http://localhost:8233/namespaces/default/workflows/${workflowId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Temporal
              </a>
            </Button>
            {reports.length > 0 && (
              <Button asChild size="lg">
                <Link to={`/workflows/${workflowId}/report`}>
                  <FileText className="h-4 w-4" />
                  Open Report
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {isRunning && (
              <Button
                variant="destructive"
                size="lg"
                onClick={handleCancel}
                disabled={cancelWorkflow.isPending}
              >
                <XCircle className="h-4 w-4" />
                Abort
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─────────── Failure surface ─────────── */}
      {isFailed && workflow.error && (
        <Alert variant="destructive">
          <XOctagon />
          <AlertTitle>Operation Failed</AlertTitle>
          <AlertDescription>
            <div className="font-mono text-[12px] leading-relaxed">
              {workflow.error}
            </div>
            {workflow.failedAgent && (
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em]">
                <span className="text-alert-400/70">Agent</span>{' '}
                <span className="text-alert-400">{workflow.failedAgent}</span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ─────────── Metric tiles ─────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/80 border border-border">
        <MetricTile
          index="01"
          label="Elapsed"
          caption={isRunning ? 'Live' : 'Total wall clock'}
          value={fmtDuration(totalDuration)}
          icon={Gauge}
          live={isRunning}
        />
        <MetricTile
          index="02"
          label="Cost"
          caption="LLM spend"
          value={fmtCost(totalCost)}
          icon={DollarSign}
        />
        <MetricTile
          index="03"
          label="Tokens"
          caption={`in ${fmtNumber(inputTokens)} · out ${fmtNumber(
            outputTokens
          )}`}
          value={fmtNumber(
            (inputTokens ?? 0) + (outputTokens ?? 0) || null
          )}
          icon={Sigma}
        />
        <MetricTile
          index="04"
          label={isRunning ? 'Agents Done' : 'Artifacts'}
          caption={
            isRunning
              ? `${completedAgents.length} / 13 complete`
              : `${deliverables.length} file${
                  deliverables.length === 1 ? '' : 's'
                } on disk`
          }
          value={
            isRunning
              ? `${completedAgents.length}`.padStart(2, '0')
              : `${deliverables.length}`.padStart(2, '0')
          }
          icon={isRunning ? Cpu : FileText}
        />
      </section>

      {/* ─────────── Live feed (running only) ─────────── */}
      {isRunning && workflowId && (
        <section>
          <header className="flex items-end justify-between mb-4">
            <div>
              <div className="label-stamp-signal mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-signal-pulse" />
                // Live Feed
              </div>
              <h2 className="font-display text-[1.6rem] font-medium leading-none text-paper-0">
                Watch the agent work
              </h2>
              <p className="mt-1.5 font-mono text-[11px] text-paper-500 uppercase tracking-[0.14em]">
                Phase transitions, agent starts &amp; completions, and raw worker
                output — as they happen.
              </p>
            </div>
          </header>
          <LiveFeed workflowId={workflowId} />
        </section>
      )}

      {/* ─────────── Agent progress (only when there's live state to show) ─────────── */}
      {(isRunning || completedAgents.length > 0) && (
        <section>
          <header className="flex items-end justify-between mb-4">
            <div>
              <div className="label-stamp mb-1.5">// Pipeline</div>
              <h2 className="font-display text-[1.6rem] font-medium leading-none text-paper-0">
                Agent progression
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500">
              {completedAgents.length} / 13 complete
            </span>
          </header>
          <AgentProgress
            completedAgents={completedAgents}
            currentAgent={workflow.currentAgent ?? null}
            failedAgent={workflow.failedAgent ?? null}
            agentMetrics={agentMetrics}
          />
        </section>
      )}

      {/* ─────────── Deliverables ─────────── */}
      {deliverables.length > 0 && (
        <section className="space-y-6">
          <header>
            <div className="label-stamp mb-1.5">// Artifacts</div>
            <h2 className="font-display text-[1.6rem] font-medium leading-none text-paper-0">
              Deliverables on disk
            </h2>
          </header>

          <DeliverableGroup
            workflowId={workflowId!}
            title="Reports"
            kicker="// Executive"
            tone="signal"
            icon={FileText}
            items={reports}
          />
          <DeliverableGroup
            workflowId={workflowId!}
            title="Agent Logs"
            kicker="// Trace"
            tone="neutral"
            icon={ScrollText}
            items={logs}
            collapsedWhenLarge
          />
          <DeliverableGroup
            workflowId={workflowId!}
            title="Prompts"
            kicker="// Inputs"
            tone="neutral"
            icon={FileCode2}
            items={prompts}
            collapsedWhenLarge
          />
        </section>
      )}
    </div>
  );
}

/* ─────────────────────── subcomponents ─────────────────────── */

function MetricTile({
  index,
  label,
  caption,
  value,
  icon: Icon,
  live,
}: {
  index: string;
  label: string;
  caption: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  live?: boolean;
}) {
  return (
    <div className="relative bg-ink-100/60 p-6 group hover:bg-ink-200/60 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <span className="flex items-center gap-2 label-stamp">
          <span className="text-signal-400 tabular-nums">{index}</span>
          <span className="h-px w-3 bg-ink-500" />
          {label}
        </span>
        <Icon
          className={cn(
            'h-4 w-4 transition-colors',
            live ? 'text-signal-400' : 'text-ink-700 group-hover:text-paper-400'
          )}
        />
      </div>
      <div className="flex items-baseline gap-3">
        <span className="font-display font-medium text-[2.6rem] leading-none text-paper-0 tabular-nums break-all">
          {value}
        </span>
        {live && (
          <span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-signal-pulse shrink-0" />
        )}
      </div>
      <div className="mt-3 font-mono text-[11px] text-paper-500 tracking-tight">
        {caption}
      </div>
    </div>
  );
}

function DeliverableGroup({
  workflowId,
  title,
  kicker,
  tone,
  icon: Icon,
  items,
  collapsedWhenLarge,
}: {
  workflowId: string;
  title: string;
  kicker: string;
  tone: 'signal' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  items: Deliverable[];
  collapsedWhenLarge?: boolean;
}) {
  if (items.length === 0) return null;

  const toneText = tone === 'signal' ? 'text-signal-300' : 'text-paper-400';
  const toneBorder =
    tone === 'signal' ? 'border-signal-400/40' : 'border-border';

  // For large lists, render first 8 and hint at the total via caption.
  const preview = collapsedWhenLarge && items.length > 8 ? items.slice(0, 8) : items;
  const hiddenCount = items.length - preview.length;

  return (
    <section className={cn('border bg-card', toneBorder)}>
      <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Icon className={cn('h-4 w-4', toneText)} />
          <div>
            <div className={cn('label-stamp mb-0.5', toneText === 'text-signal-300' && 'text-signal-400')}>
              {kicker}
            </div>
            <h3 className="font-display text-[1.1rem] text-paper-0 leading-none">
              {title}
            </h3>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 tabular-nums">
          {items.length} file{items.length === 1 ? '' : 's'}
        </span>
      </header>

      <ul className="divide-y divide-border/40">
        {preview.map((d, i) => (
          <li
            key={d.path}
            className="flex items-center gap-5 px-5 py-3 hover:bg-signal-400/[0.04] transition-colors"
          >
            <span className="index-tag tabular-nums w-8 shrink-0">
              {(i + 1).toString().padStart(2, '0')}
            </span>
            <FileDigit className="h-3.5 w-3.5 text-paper-400 shrink-0" />
            <span className="flex-1 min-w-0 font-mono text-[12px] text-paper-0 truncate">
              {d.name}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 tabular-nums shrink-0">
              {fmtBytes(d.size)}
            </span>
            <a
              href={`/api/workflows/${workflowId}/deliverables/${d.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'h-8 w-8 shrink-0 flex items-center justify-center border',
                'border-ink-400 text-paper-400',
                'hover:border-signal-400 hover:text-signal-300 transition-colors'
              )}
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <div className="px-5 py-3 border-t border-border/40 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500">
          +{hiddenCount} more in audit‑logs
        </div>
      )}
    </section>
  );
}

function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
