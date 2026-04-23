import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  ArrowDownToLine,
  CheckCircle2,
  CircleDot,
  Flag,
  HeartPulse,
  Pause,
  Play,
  Radio,
  Terminal,
} from 'lucide-react';
import { useWorkflowEvents } from '@/hooks/useWorkflowEvents';
import { cn } from '@/lib/utils';
import type { WorkflowEvent } from '@shannon/shared';

interface LiveFeedProps {
  workflowId: string;
  enabled?: boolean;
}

/**
 * Terminal-style feed of live workflow events. Structured events
 * (phase-change, agent-start/complete/failed, cost-delta, finished)
 * render as stamped rows. Raw worker stdout renders in a muted
 * monospace line. Auto-scrolls to the bottom unless the user scrolls
 * up or explicitly pauses.
 */
export default function LiveFeed({ workflowId, enabled = true }: LiveFeedProps) {
  const { events, status, finished } = useWorkflowEvents(workflowId, {
    enabled,
  });

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom whenever a new event arrives, unless the user
  // has manually scrolled up or paused.
  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length, autoScroll]);

  // Detect manual scroll-up: pauses auto-scroll; user re-enables with button.
  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    if (!atBottom && autoScroll) setAutoScroll(false);
    if (atBottom && !autoScroll) setAutoScroll(true);
  };

  // Strip the snapshot's initial batch from the rendered list — we render
  // its `recentLogs` inline as the first entries, so the snapshot itself
  // is metadata, not a visible row.
  const rows = useMemo(() => {
    const out: WorkflowEvent[] = [];
    for (const e of events) {
      if (e.kind === 'snapshot') {
        // Expand recentLogs into synthetic log events
        e.recentLogs.forEach((line) => {
          out.push({
            kind: 'log',
            ts: e.ts,
            stream: 'system',
            line,
          } as WorkflowEvent);
        });
        continue;
      }
      if (e.kind === 'heartbeat') continue; // silent
      out.push(e);
    }
    return out;
  }, [events]);

  const connTone =
    status === 'open'
      ? 'text-signal-300 border-signal-400/60 bg-signal-400/10'
      : status === 'connecting'
        ? 'text-wait-400 border-wait-500/40 bg-wait-500/10'
        : status === 'error'
          ? 'text-alert-400 border-alert-500/50 bg-alert-500/10'
          : 'text-paper-500 border-ink-400 bg-transparent';

  return (
    <section className="flex flex-col border border-signal-400/40 bg-ink-0 h-[80vh] min-h-[600px]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/70 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-signal-400" />
          <span className="label-stamp-signal">// Live Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 border px-2 py-[3px]',
              'font-mono text-[10px] uppercase tracking-[0.22em]',
              connTone
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                status === 'open' && 'bg-signal-400 animate-signal-pulse',
                status === 'connecting' && 'bg-wait-400',
                status === 'error' && 'bg-alert-400',
                status === 'closed' && 'bg-ink-700',
                status === 'idle' && 'bg-ink-700'
              )}
            />
            {status === 'open'
              ? finished
                ? 'Finished'
                : 'Streaming'
              : status}
          </span>
          <button
            type="button"
            onClick={() => setAutoScroll((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-[3px] border',
              'font-mono text-[10px] uppercase tracking-[0.22em]',
              autoScroll
                ? 'border-ink-400 text-paper-400 hover:border-signal-400 hover:text-signal-300'
                : 'border-signal-400/60 bg-signal-400/10 text-signal-300 hover:bg-signal-400/15'
            )}
            title={autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
          >
            {autoScroll ? (
              <>
                <Pause className="h-3 w-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Follow
              </>
            )}
          </button>
        </div>
      </header>

      {/* Scroller */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto font-mono text-[12px] leading-[1.55] py-2"
      >
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-paper-500 font-mono text-[11px] uppercase tracking-[0.2em]">
            {status === 'connecting' ? 'Attaching to stream…' : 'Waiting for output…'}
          </div>
        )}
        <ul>
          {rows.map((ev, i) => (
            <FeedRow key={`${ev.kind}-${ev.ts}-${i}`} event={ev} />
          ))}
        </ul>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 py-2 border-t border-border/70 shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500">
        <span>
          {rows.length} event{rows.length === 1 ? '' : 's'}
        </span>
        {!autoScroll && (
          <button
            type="button"
            onClick={() => {
              setAutoScroll(true);
              const el = scrollerRef.current;
              if (el) el.scrollTop = el.scrollHeight;
            }}
            className="inline-flex items-center gap-1.5 text-signal-300 hover:text-signal-200"
          >
            <ArrowDownToLine className="h-3 w-3" />
            Jump to latest
          </button>
        )}
      </footer>
    </section>
  );
}

/* ───────────────────────── row renderer ───────────────────────── */

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().slice(11, 19);
}

function FeedRow({ event }: { event: WorkflowEvent }) {
  const Stamp = ({ tone }: { tone: string }) => (
    <span className={cn('tabular-nums text-[10px] pr-3 pl-4 shrink-0', tone)}>
      {fmtTime(event.ts)}
    </span>
  );

  switch (event.kind) {
    case 'log': {
      const toneClass =
        event.stream === 'stderr'
          ? 'text-alert-400'
          : event.stream === 'system'
            ? 'text-paper-500'
            : 'text-paper-0/80';
      return (
        <li className="flex items-start hover:bg-signal-400/[0.03]">
          <Stamp tone="text-ink-700" />
          <span className="pl-3 pr-4 py-[1px] break-all whitespace-pre-wrap flex-1">
            <span className={toneClass}>{event.line}</span>
          </span>
        </li>
      );
    }

    case 'phase-change':
      return (
        <li className="flex items-start bg-signal-400/[0.04] border-l-2 border-signal-400 my-1">
          <Stamp tone="text-signal-400" />
          <span className="pl-3 pr-4 py-1 flex-1">
            <span className="inline-flex items-center gap-2 text-signal-300">
              <Flag className="h-3 w-3" />
              <span className="uppercase tracking-[0.22em] text-[10px]">
                Phase
              </span>
            </span>
            <span className="ml-3 text-paper-0">
              {event.from ? (
                <>
                  <span className="text-ink-700">{event.from}</span>
                  <span className="mx-2 text-ink-700">→</span>
                </>
              ) : (
                <span className="text-ink-700 mr-2">—→</span>
              )}
              <span className="text-signal-300">{event.to ?? 'done'}</span>
            </span>
          </span>
        </li>
      );

    case 'agent-start':
      return (
        <li className="flex items-start bg-signal-400/[0.04] border-l-2 border-signal-400/60 my-1">
          <Stamp tone="text-signal-300" />
          <span className="pl-3 pr-4 py-1 flex-1">
            <span className="inline-flex items-center gap-2 text-signal-300">
              <Radio className="h-3 w-3 animate-signal-pulse" />
              <span className="uppercase tracking-[0.22em] text-[10px]">
                Agent start
              </span>
            </span>
            <span className="ml-3 text-paper-0 font-medium">{event.agent}</span>
            {event.phase && (
              <span className="ml-2 text-paper-500 text-[10px] uppercase tracking-[0.18em]">
                phase · {event.phase}
              </span>
            )}
          </span>
        </li>
      );

    case 'agent-complete':
      return (
        <li className="flex items-start bg-go-500/[0.05] border-l-2 border-go-500/60 my-1">
          <Stamp tone="text-go-400" />
          <span className="pl-3 pr-4 py-1 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-2 text-go-400">
              <CheckCircle2 className="h-3 w-3" />
              <span className="uppercase tracking-[0.22em] text-[10px]">
                Complete
              </span>
            </span>
            <span className="text-paper-0 font-medium">{event.agent}</span>
            <span className="text-paper-500 text-[10px] uppercase tracking-[0.18em] tabular-nums">
              {fmtDuration(event.durationMs)}
            </span>
            {event.costUsd != null && (
              <span className="text-wait-400 text-[10px] uppercase tracking-[0.18em] tabular-nums">
                ${event.costUsd.toFixed(4)}
              </span>
            )}
          </span>
        </li>
      );

    case 'agent-failed':
      return (
        <li className="flex items-start bg-alert-500/[0.08] border-l-2 border-alert-500 my-1">
          <Stamp tone="text-alert-400" />
          <span className="pl-3 pr-4 py-1 flex-1">
            <span className="inline-flex items-center gap-2 text-alert-400">
              <AlertOctagon className="h-3 w-3" />
              <span className="uppercase tracking-[0.22em] text-[10px]">
                Failed
              </span>
            </span>
            <span className="ml-3 text-paper-0 font-medium">{event.agent}</span>
            {event.error && (
              <span className="ml-3 text-alert-400 text-[11px]">
                {event.error}
              </span>
            )}
          </span>
        </li>
      );

    case 'cost-delta':
      return (
        <li className="flex items-start">
          <Stamp tone="text-wait-400" />
          <span className="pl-3 pr-4 py-[2px] flex-1 text-wait-400 text-[11px]">
            <span className="inline-flex items-center gap-2">
              <CircleDot className="h-2.5 w-2.5" />
              <span className="uppercase tracking-[0.22em] text-[10px]">
                Cost
              </span>
              <span className="tabular-nums">
                +${event.delta.toFixed(4)}
              </span>
              <span className="text-ink-700">/</span>
              <span className="tabular-nums text-paper-400">
                ${event.total.toFixed(4)} total
              </span>
            </span>
          </span>
        </li>
      );

    case 'finished':
      return (
        <li
          className={cn(
            'flex items-start my-2 border-l-2',
            event.status === 'completed'
              ? 'bg-go-500/[0.08] border-go-500'
              : 'bg-alert-500/[0.08] border-alert-500'
          )}
        >
          <Stamp
            tone={
              event.status === 'completed' ? 'text-go-400' : 'text-alert-400'
            }
          />
          <span className="pl-3 pr-4 py-2 flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                'inline-flex items-center gap-2',
                event.status === 'completed' ? 'text-go-400' : 'text-alert-400'
              )}
            >
              <Flag className="h-3.5 w-3.5" />
              <span className="uppercase tracking-[0.24em] text-[11px] font-medium">
                Operation {event.status}
              </span>
            </span>
            <span className="text-paper-500 text-[10px] uppercase tracking-[0.18em] tabular-nums">
              {fmtDuration(event.totalDurationMs)}
            </span>
            <span className="text-wait-400 text-[10px] uppercase tracking-[0.18em] tabular-nums">
              ${event.totalCostUsd.toFixed(4)}
            </span>
          </span>
        </li>
      );

    case 'error':
      return (
        <li className="flex items-start bg-alert-500/[0.06] border-l-2 border-alert-500/70 my-1">
          <Stamp tone="text-alert-400" />
          <span className="pl-3 pr-4 py-1 flex-1 text-alert-400">
            <span className="inline-flex items-center gap-2">
              <AlertOctagon className="h-3 w-3" />
              <span className="uppercase tracking-[0.22em] text-[10px]">
                Stream error
              </span>
            </span>
            <span className="ml-3">{event.message}</span>
          </span>
        </li>
      );

    case 'heartbeat':
      // Rendered off by the parent; kept for type exhaustiveness.
      return (
        <li className="flex items-start opacity-40">
          <Stamp tone="text-ink-700" />
          <span className="pl-3 pr-4 py-[1px] flex-1 text-ink-700">
            <HeartPulse className="inline h-3 w-3" /> heartbeat
          </span>
        </li>
      );

    case 'snapshot':
      // Rendered off by the parent (expanded into log rows).
      return null;
  }
}

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
