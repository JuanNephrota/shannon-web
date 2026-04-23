import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ExternalLink,
  Plus,
  Search,
} from 'lucide-react';
import { useWorkflows } from '@/api/hooks';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function WorkflowList() {
  const { data, isLoading, error } = useWorkflows();
  const [search, setSearch] = useState('');

  const workflows = data?.workflows || [];
  const filtered = workflows.filter(
    (w) =>
      w.workflowId.toLowerCase().includes(search.toLowerCase()) ||
      w.webUrl?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.toISOString().slice(0, 10)} · ${d.toISOString().slice(11, 19)}Z`;
  };

  const fmtDuration = (start: number, end?: number) => {
    const endTime = end || Date.now();
    const ms = endTime - start;
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m`;
    return `${Math.floor(ms / 1000)}s`;
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-5">
        <div className="label-stamp-signal animate-stamp-in">// Archive</div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1
              className="font-display text-5xl font-medium leading-[0.95] text-paper-0 tracking-[-0.02em] animate-stamp-in"
              style={{ animationDelay: '0.1s' }}
            >
              All operations<span className="text-signal-400">.</span>
            </h1>
            <p
              className="mt-3 font-mono text-[13px] text-paper-400 leading-relaxed animate-stamp-in"
              style={{ animationDelay: '0.2s' }}
            >
              Every penetration test Shannon has ever run on this install.
              Filter by ID or target host.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="animate-stamp-in"
            style={{ animationDelay: '0.3s' }}
          >
            <Link to="/workflows/new">
              <Plus className="h-4 w-4" />
              Launch Op
            </Link>
          </Button>
        </div>
      </header>

      {/* Search + table */}
      <section className="border border-border bg-card">
        <header className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-border/60">
          <div>
            <div className="label-stamp mb-1.5">// Registry</div>
            <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0">
              {search ? 'Matches' : 'All'}
            </h2>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-paper-500" />
            <Input
              type="text"
              placeholder="filter · workflow id or host"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="hidden md:block font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 tabular-nums">
            {filtered.length}
            {filtered.length !== workflows.length && (
              <>
                <span className="text-ink-700"> / </span>
                {workflows.length}
              </>
            )}
          </span>
        </header>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <span className="label-stamp text-alert-400">// Error</span>
            <p className="mt-3 font-mono text-[13px] text-paper-0">
              Failed to reach the workflow registry.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <>
            {/* Column headers (mono small caps) */}
            <div className="hidden md:grid grid-cols-[40px_1fr_1fr_auto_auto_auto_40px] items-center gap-5 px-6 py-2 border-b border-border/40 bg-ink-0/40">
              <ColHead />
              <ColHead>Operation</ColHead>
              <ColHead>Target</ColHead>
              <ColHead>Status</ColHead>
              <ColHead className="text-right">Started</ColHead>
              <ColHead className="text-right">Duration</ColHead>
              <ColHead />
            </div>
            <ul className="divide-y divide-border/40">
              {filtered.map((w, i) => (
                <li key={w.workflowId} className="group">
                  <Link
                    to={`/workflows/${w.workflowId}`}
                    className={cn(
                      'grid grid-cols-1 md:grid-cols-[40px_1fr_1fr_auto_auto_auto_40px]',
                      'items-center gap-x-5 gap-y-1 px-6 py-3.5',
                      'transition-colors hover:bg-signal-400/[0.04]'
                    )}
                  >
                    <span className="index-tag tabular-nums">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[12px] text-paper-0 tracking-tight truncate min-w-0">
                      {w.workflowId}
                    </span>
                    <span className="font-mono text-[11px] text-paper-400 truncate min-w-0">
                      {w.webUrl ? (
                        <span className="text-paper-0/90">{w.webUrl}</span>
                      ) : (
                        <span className="text-ink-700">—</span>
                      )}
                    </span>
                    <span>
                      <StatusBadge status={w.status} size="sm" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper-500 tabular-nums text-right">
                      {fmtTime(w.startTime)}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper-400 tabular-nums text-right">
                      {fmtDuration(w.startTime, w.endTime)}
                    </span>
                    <span className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          // Nested <a> in <a> is invalid HTML — use a button
                          // that opens the Temporal UI via window.open.
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            `http://localhost:8233/namespaces/default/workflows/${w.workflowId}`,
                            '_blank',
                            'noopener,noreferrer'
                          );
                        }}
                        className="text-paper-500 hover:text-signal-300 transition-colors p-0"
                        title="Open in Temporal UI"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <ArrowUpRight
                        className={cn(
                          'h-4 w-4 text-ink-700 transition-all',
                          'group-hover:text-signal-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
                        )}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function ColHead({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-paper-500',
        className
      )}
    >
      {children}
    </span>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="inline-flex items-center gap-2 label-stamp mb-6">
        <span className="h-1 w-1 rounded-full bg-paper-500" />
        {search ? 'No matches' : 'Registry empty'}
      </div>
      {search ? (
        <p className="font-mono text-[13px] text-paper-0">
          Nothing matches{' '}
          <code className="text-signal-300">"{search}"</code>.
        </p>
      ) : (
        <>
          <p className="font-mono text-[13px] text-paper-0">
            No operations on record yet.
          </p>
          <Link
            to="/workflows/new"
            className="inline-flex items-center gap-2 mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-signal-300 hover:text-signal-200 border-b border-signal-400/40 hover:border-signal-300 pb-0.5 transition-colors"
          >
            Launch your first pentest
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </>
      )}
    </div>
  );
}
