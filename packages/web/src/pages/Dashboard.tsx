import { Link } from 'react-router-dom';
import { Play, ArrowUpRight, Radio, ClipboardCheck, Flame } from 'lucide-react';
import { useWorkflows } from '@/api/hooks';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { data, isLoading, error } = useWorkflows();

  const workflows = data?.workflows || [];
  const runningWorkflows = workflows.filter((w) => w.status === 'running');
  const recentWorkflows = workflows.slice(0, 6);
  const completedToday = workflows.filter(
    (w) =>
      w.status === 'completed' &&
      new Date(w.startTime).toDateString() === new Date().toDateString()
  );

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.toISOString().slice(0, 10)} · ${d
      .toISOString()
      .slice(11, 19)}`;
  };

  return (
    <div className="space-y-12">
      {/* ─────────────────── Header ─────────────────── */}
      <header className="space-y-5">
        <div className="flex items-center gap-3 label-stamp-signal animate-stamp-in">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-signal-pulse" />
          Operator Overview
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1
              className="font-display text-6xl font-medium leading-[0.95] text-paper-0 tracking-[-0.02em] animate-stamp-in"
              style={{ animationDelay: '0.1s' }}
            >
              Field status,
              <br />
              <span className="text-paper-400 italic">
                under control<span className="text-signal-400">.</span>
              </span>
            </h1>
            <p
              className="font-mono text-[13px] text-paper-400 leading-relaxed max-w-xl animate-stamp-in"
              style={{ animationDelay: '0.25s' }}
            >
              Launch and monitor AI‑driven penetration tests across your targets.
              All sessions are audit‑logged and replay‑safe.
            </p>
          </div>
          <div
            className="flex items-center gap-3 animate-stamp-in"
            style={{ animationDelay: '0.35s' }}
          >
            <Button asChild variant="outline" size="lg">
              <Link to="/workflows">
                <span>Browse All</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link to="/workflows/new">
                <Play className="h-4 w-4" />
                <span>Launch Op</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─────────────────── Stat tiles ─────────────────── */}
      <section
        className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/80 border border-border animate-stamp-in"
        style={{ animationDelay: '0.4s' }}
      >
        <StatTile
          index="01"
          label="In Flight"
          value={runningWorkflows.length}
          caption="Active workflows"
          icon={Radio}
          live={runningWorkflows.length > 0}
        />
        <StatTile
          index="02"
          label="Completed · Today"
          value={completedToday.length}
          caption={
            completedToday.length === 0
              ? 'No sessions closed yet'
              : 'Sessions closed'
          }
          icon={ClipboardCheck}
        />
        <StatTile
          index="03"
          label="Lifetime"
          value={workflows.length}
          caption="Workflows archived"
          icon={Flame}
        />
      </section>

      {/* ─────────────────── In-flight panel ─────────────────── */}
      {runningWorkflows.length > 0 && (
        <Panel
          kicker="// Live"
          title="In‑flight operations"
          caption={`${runningWorkflows.length} process${
            runningWorkflows.length === 1 ? '' : 'es'
          } streaming now`}
          accent
        >
          <WorkflowList workflows={runningWorkflows} live />
        </Panel>
      )}

      {/* ─────────────────── Recent panel ─────────────────── */}
      <Panel
        kicker="// Archive"
        title="Recent operations"
        caption="Most recent six sessions across all operators"
        action={
          <Link
            to="/workflows"
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-400 hover:text-signal-300 transition-colors"
          >
            View all
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      >
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <span className="label-stamp text-alert-400">// Error</span>
            <p className="mt-3 font-mono text-[13px] text-paper-0">
              Failed to reach the workflow registry.
            </p>
          </div>
        ) : recentWorkflows.length === 0 ? (
          <EmptyState />
        ) : (
          <WorkflowList workflows={recentWorkflows} formatTime={formatTime} />
        )}
      </Panel>
    </div>
  );
}

/* ───────────────────────── subcomponents ───────────────────────── */

function StatTile({
  index,
  label,
  value,
  caption,
  icon: Icon,
  live,
}: {
  index: string;
  label: string;
  value: number;
  caption: string;
  icon: React.ComponentType<{ className?: string }>;
  live?: boolean;
}) {
  return (
    <div className="relative bg-ink-100/60 p-6 group hover:bg-ink-200/60 transition-colors">
      {/* top rail */}
      <div className="flex items-center justify-between mb-6">
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
        <span className="font-display font-medium text-[5rem] leading-none text-paper-0 tabular-nums">
          {value.toString().padStart(2, '0')}
        </span>
        {live && value > 0 && (
          <span className="h-2 w-2 rounded-full bg-signal-400 animate-signal-pulse" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[11px] text-paper-500 tracking-tight">
          {caption}
        </span>
        <BarMeter value={value} live={live} />
      </div>
    </div>
  );
}

/** A tiny decorative bar gauge — gives tiles a readout quality. */
function BarMeter({ value, live }: { value: number; live?: boolean }) {
  const bars = 8;
  const filled = Math.min(value, bars);
  return (
    <div className="flex items-end gap-px" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const isOn = i < filled;
        return (
          <span
            key={i}
            className={cn(
              'w-[3px] transition-colors',
              isOn
                ? live
                  ? 'bg-signal-400'
                  : 'bg-paper-400'
                : 'bg-ink-400'
            )}
            style={{ height: `${4 + (i + 1) * 1.5}px` }}
          />
        );
      })}
    </div>
  );
}

function Panel({
  kicker,
  title,
  caption,
  action,
  children,
  accent,
}: {
  kicker: string;
  title: string;
  caption?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        'relative border bg-card',
        accent
          ? 'border-signal-400/40 shadow-[inset_0_0_0_1px_rgba(245,132,26,0.08)]'
          : 'border-border'
      )}
    >
      <header className="flex flex-wrap items-end justify-between gap-3 px-6 pt-5 pb-4 border-b border-border/60">
        <div>
          <div
            className={cn(
              'font-mono text-[10px] font-medium uppercase tracking-[0.22em] mb-2',
              accent ? 'text-signal-400' : 'text-paper-500'
            )}
          >
            {kicker}
          </div>
          <h2 className="font-display text-[1.6rem] font-medium leading-none text-paper-0">
            {title}
          </h2>
          {caption && (
            <p className="mt-1.5 font-mono text-[11px] text-paper-500 uppercase tracking-[0.14em]">
              {caption}
            </p>
          )}
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}

function WorkflowList({
  workflows,
  live,
  formatTime,
}: {
  workflows: Array<{
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'pending' | 'unknown';
    startTime: number;
    webUrl?: string;
  }>;
  live?: boolean;
  formatTime?: (ts: number) => string;
}) {
  return (
    <ul className="divide-y divide-border/60">
      {workflows.map((w, i) => (
        <li key={w.workflowId} className="group">
          <Link
            to={`/workflows/${w.workflowId}`}
            className={cn(
              'flex items-center gap-5 px-6 py-4 transition-colors',
              'hover:bg-signal-400/[0.04]'
            )}
          >
            <span className="index-tag tabular-nums w-10 shrink-0">
              {(i + 1).toString().padStart(2, '0')}
            </span>

            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-3">
                {live && (
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-signal-pulse shrink-0" />
                )}
                <span className="font-mono text-[13px] text-paper-0 truncate tracking-tight">
                  {w.workflowId}
                </span>
              </span>
              <span className="mt-1 flex items-center gap-2 font-mono text-[11px] text-paper-500">
                {w.webUrl ? (
                  <>
                    <span className="text-ink-700">target →</span>
                    <span className="truncate">{w.webUrl}</span>
                  </>
                ) : formatTime ? (
                  <>
                    <span className="text-ink-700">started</span>
                    <span className="tabular-nums">
                      {formatTime(w.startTime)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-ink-700">started</span>
                    <span className="tabular-nums">
                      {new Date(w.startTime).toISOString().slice(11, 19)}Z
                    </span>
                  </>
                )}
              </span>
            </span>

            <StatusBadge status={w.status} size="sm" />
            <ArrowUpRight
              className={cn(
                'h-4 w-4 text-ink-700 transition-all',
                'group-hover:text-signal-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
              )}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="inline-flex items-center gap-2 label-stamp mb-6">
        <span className="h-1 w-1 rounded-full bg-paper-500" />
        Console idle
      </div>
      <div className="font-mono text-[13px] text-paper-0 leading-relaxed">
        <span className="text-signal-400">$ </span>
        <span>shannon run --target &lt;url&gt;</span>
        <span className="caret" />
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-paper-500">
        No operations on record yet.
      </p>
      <Link
        to="/workflows/new"
        className="inline-flex items-center gap-2 mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-signal-300 hover:text-signal-200 border-b border-signal-400/40 hover:border-signal-300 pb-0.5 transition-colors"
      >
        Launch your first pentest
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
