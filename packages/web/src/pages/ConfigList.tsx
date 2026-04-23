import { Link } from 'react-router-dom';
import { FileCode, Trash2, Shield, Filter, Plus, ArrowUpRight, Info } from 'lucide-react';
import { useConfigs, useDeleteConfig } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ConfigList() {
  const { data, isLoading, error } = useConfigs();
  const deleteConfig = useDeleteConfig();

  const configs = data?.configs || [];

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteConfig.mutateAsync(name);
    } catch (err) {
      console.error('Failed to delete config:', err);
    }
  };

  const formatDate = (s: string) => new Date(s).toISOString().slice(0, 10);

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-5">
        <div className="label-stamp-signal animate-stamp-in">// Configs</div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1
              className="font-display text-5xl font-medium leading-[0.95] text-paper-0 tracking-[-0.02em] animate-stamp-in"
              style={{ animationDelay: '0.1s' }}
            >
              Target configurations<span className="text-signal-400">.</span>
            </h1>
            <p
              className="mt-3 font-mono text-[13px] text-paper-400 leading-relaxed animate-stamp-in"
              style={{ animationDelay: '0.2s' }}
            >
              Shannon reads these YAML files to sign into a target and bound
              the test. Use the guided builder to draft one without
              hand‑editing.
            </p>
          </div>
          <div
            className="flex items-center gap-3 animate-stamp-in"
            style={{ animationDelay: '0.3s' }}
          >
            <Button asChild size="lg">
              <Link to="/configs/new">
                <Plus className="h-4 w-4" />
                New Configuration
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Alert>
        <Info />
        <AlertTitle>// Storage</AlertTitle>
        <AlertDescription>
          Configurations live in{' '}
          <code className="text-signal-300">
            {'$SHANNON_ROOT'}/configs/
          </code>
          . Files you create here are read by the worker at launch time.
        </AlertDescription>
      </Alert>

      {/* List panel */}
      <section className="border border-border bg-card">
        <header className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/60">
          <div>
            <div className="label-stamp mb-1.5">// Archive</div>
            <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0">
              On disk
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 tabular-nums">
            {configs.length} file{configs.length === 1 ? '' : 's'}
          </span>
        </header>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <span className="label-stamp text-alert-400">// Error</span>
            <p className="mt-3 font-mono text-[13px] text-paper-0">
              Failed to load configurations.
            </p>
          </div>
        ) : configs.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-border/60">
            {configs.map((c, i) => (
              <li key={c.name} className="group">
                <div className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-signal-400/[0.04]">
                  <span className="index-tag tabular-nums w-8 shrink-0">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>

                  <FileCode className="h-4 w-4 text-paper-400 shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[13px] text-paper-0 tracking-tight truncate">
                      {c.name}
                      <span className="text-ink-700">.yaml</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-paper-500">
                      {c.hasAuthentication && (
                        <span className="inline-flex items-center gap-1 text-go-400">
                          <Shield className="h-3 w-3" />
                          AUTH
                        </span>
                      )}
                      {c.hasRules && (
                        <span className="inline-flex items-center gap-1 text-signal-300">
                          <Filter className="h-3 w-3" />
                          RULES
                        </span>
                      )}
                      <span className="text-ink-700">·</span>
                      <span className="tabular-nums">
                        modified {formatDate(c.lastModified)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(c.name)}
                    disabled={deleteConfig.isPending}
                    title="Delete"
                    className={cn(
                      'h-8 w-8 flex items-center justify-center border',
                      'border-ink-400 text-paper-400',
                      'hover:border-alert-500/60 hover:text-alert-400 transition-colors'
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Schema reference */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/80 border border-border">
        <SchemaCard
          title="Authentication"
          kicker="// Section"
          icon={Shield}
          bullets={[
            'Login type — form, SSO, API, or basic',
            'Login URL',
            'Credentials — username, password, optional TOTP',
            'Login flow — natural-language steps',
            'Success condition — URL or DOM match',
          ]}
        />
        <SchemaCard
          title="Rules"
          kicker="// Section"
          icon={Filter}
          bullets={[
            'Avoid — paths Shannon should skip',
            'Focus — paths to prioritize',
            'Match by path, subdomain, domain, header, method, or parameter',
          ]}
        />
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="inline-flex items-center gap-2 label-stamp mb-6">
        <span className="h-1 w-1 rounded-full bg-paper-500" />
        Archive empty
      </div>
      <p className="font-mono text-[13px] text-paper-0">
        No configurations on disk yet.
      </p>
      <Link
        to="/configs/new"
        className="inline-flex items-center gap-2 mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-signal-300 hover:text-signal-200 border-b border-signal-400/40 hover:border-signal-300 pb-0.5 transition-colors"
      >
        Draft your first configuration
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function SchemaCard({
  title,
  kicker,
  icon: Icon,
  bullets,
}: {
  title: string;
  kicker: string;
  icon: React.ComponentType<{ className?: string }>;
  bullets: string[];
}) {
  return (
    <div className="bg-ink-100/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="label-stamp">{kicker}</span>
        <Icon className="h-4 w-4 text-signal-400" />
      </div>
      <h3 className="font-display text-[1.25rem] font-medium text-paper-0 leading-none mb-3">
        {title}
      </h3>
      <ul className="space-y-1.5 font-mono text-[12px] text-paper-400">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-signal-400 shrink-0 mt-[5px] h-px w-2 bg-signal-400" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
