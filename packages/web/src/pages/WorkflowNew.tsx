import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  FileCode,
  FolderTree,
  Globe,
  Info,
  Loader2,
  Play,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import { useStartWorkflow, useConfigs } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/** Sentinel for "no configuration" — Radix forbids empty-string values,
 *  but we used to model the absence of a config as "". Native <select>
 *  handles empty strings fine, but we keep this explicit to make the
 *  intent (no bound profile) legible in code and UI. */
const NO_CONFIG = '';

export default function WorkflowNew() {
  const navigate = useNavigate();
  const startWorkflow = useStartWorkflow();
  const { data: configsData } = useConfigs();

  const [webUrl, setWebUrl] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [configName, setConfigName] = useState<string>(NO_CONFIG);
  const [pipelineTestingMode, setPipelineTestingMode] = useState(false);

  const configs = configsData?.configs || [];
  const selected = configs.find((c) => c.name === configName);

  const canSubmit =
    webUrl.trim().length > 0 &&
    repoPath.trim().length > 0 &&
    !startWorkflow.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await startWorkflow.mutateAsync({
        webUrl,
        repoPath,
        configName: configName || undefined,
        pipelineTestingMode,
      });
      navigate(`/workflows/${result.workflowId}`);
    } catch (err) {
      console.error('Failed to start workflow:', err);
    }
  };

  return (
    <div className="space-y-10">
      {/* ─────────────── Header ─────────────── */}
      <header className="space-y-5">
        <Link
          to="/workflows"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 hover:text-signal-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Workflows
        </Link>
        <div className="space-y-3 max-w-3xl">
          <div className="label-stamp-signal flex items-center gap-2 animate-stamp-in">
            <Rocket className="h-3 w-3" />
            // Launch Sequence
          </div>
          <h1
            className="font-display text-5xl font-medium leading-[0.95] text-paper-0 tracking-[-0.02em] animate-stamp-in"
            style={{ animationDelay: '0.1s' }}
          >
            Start a new operation<span className="text-signal-400">.</span>
          </h1>
          <p
            className="font-mono text-[13px] text-paper-400 leading-relaxed animate-stamp-in"
            style={{ animationDelay: '0.2s' }}
          >
            Point Shannon at a target, hand over the source tree, optionally
            bind a config profile. Every step is audit‑logged and can be
            replayed.
          </p>
        </div>
      </header>

      {/* ─────────────── Body ─────────────── */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-8 items-start"
      >
        {/* ── Left: form ── */}
        <div className="space-y-6">
          {/* Section 01 — Target */}
          <Section index="01" title="Target" kicker="// Scope" icon={Target}>
            <FieldRow
              label="Target URL"
              caption="Full origin — http(s)://…"
              required
              icon={Globe}
            >
              <Input
                id="webUrl"
                type="url"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                placeholder="https://staging.acme.test"
                required
              />
            </FieldRow>

            <FieldRow
              label="Source tree"
              caption="Absolute path on worker host"
              required
              icon={FolderTree}
            >
              <Input
                id="repoPath"
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="/Users/you/src/acme-web"
                required
              />
            </FieldRow>
          </Section>

          {/* Section 02 — Profile */}
          <Section
            index="02"
            title="Profile"
            kicker="// Optional"
            icon={SlidersHorizontal}
          >
            <FieldRow
              label="Configuration"
              caption={
                configs.length === 0
                  ? 'None on disk — draft one from Configs'
                  : `${configs.length} available`
              }
              icon={FileCode}
            >
              <NativeSelect
                value={configName}
                onChange={setConfigName}
                options={[
                  { value: NO_CONFIG, label: '— None (unauthenticated scan) —' },
                  ...configs.map((c) => ({
                    value: c.name,
                    label: `${c.name}${c.hasAuthentication ? ' · with auth' : ''}${
                      c.hasRules ? ' · rules' : ''
                    }`,
                  })),
                ]}
              />
            </FieldRow>

            {selected && (
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-400">
                <span className="text-ink-700">Bound:</span>
                {selected.hasAuthentication && (
                  <span className="inline-flex items-center gap-1 text-go-400">
                    <ShieldCheck className="h-3 w-3" /> Auth
                  </span>
                )}
                {selected.hasRules && (
                  <span className="inline-flex items-center gap-1 text-signal-300">
                    <Target className="h-3 w-3" /> Rules
                  </span>
                )}
                <Link
                  to="/configs"
                  className="ml-auto text-paper-400 hover:text-signal-300 border-b border-ink-500 hover:border-signal-300 pb-0.5 transition-colors"
                >
                  View configs →
                </Link>
              </div>
            )}

            <label className="flex items-start gap-3 pt-2 cursor-pointer group">
              <Checkbox
                id="pipelineTestingMode"
                checked={pipelineTestingMode}
                onCheckedChange={(c) => setPipelineTestingMode(c === true)}
                className="mt-[2px]"
              />
              <span className="flex-1">
                <span className="block font-mono text-[11px] uppercase tracking-[0.22em] text-paper-0">
                  Pipeline testing mode
                </span>
                <span className="block mt-1 font-mono text-[11px] text-paper-500 leading-relaxed">
                  Faster retries, minimal prompts. Use when sanity‑checking the
                  worker itself rather than finding real vulns.
                </span>
              </span>
            </label>
          </Section>

          {/* Submit row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 flex items-center gap-2">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  canSubmit ? 'bg-signal-400 animate-signal-pulse' : 'bg-ink-700'
                )}
              />
              {canSubmit ? 'Ready to engage' : 'Awaiting target + source tree'}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={!canSubmit}>
                {startWorkflow.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Engaging…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Engage Operation
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {startWorkflow.isError && (
            <Alert variant="destructive">
              <AlertOctagon />
              <AlertTitle>Launch Failed</AlertTitle>
              <AlertDescription>
                {(startWorkflow.error as Error).message ||
                  'Unknown error starting workflow'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* ── Right: briefing ── */}
        <aside className="xl:sticky xl:top-16 self-start space-y-6">
          <PipelinePanel />
          <Alert>
            <Info />
            <AlertTitle>// Safety</AlertTitle>
            <AlertDescription>
              Only run Shannon against systems you're authorized to test. Every
              request the agent makes is logged and retained in{' '}
              <code className="text-signal-300">audit-logs/</code>.
            </AlertDescription>
          </Alert>
        </aside>
      </form>
    </div>
  );
}

/* ──────────────────── subcomponents ──────────────────── */

function Section({
  index,
  title,
  kicker,
  icon: Icon,
  children,
}: {
  index: string;
  title: string;
  kicker: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="relative border border-border bg-card">
      <header className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-border/60">
        <span className="index-tag tabular-nums pt-1.5">[{index}]</span>
        <div>
          <div className="label-stamp mb-2">{kicker}</div>
          <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0 flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-signal-400" />}
            {title}
          </h2>
        </div>
      </header>
      <div className="p-6 space-y-5">{children}</div>
    </section>
  );
}

function FieldRow({
  label,
  caption,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  caption?: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-paper-0 flex items-center gap-2">
          {Icon && <Icon className="h-3 w-3 text-signal-400" />}
          {label}
          {required && <span className="text-signal-400">*</span>}
        </span>
        {caption && (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-700 truncate">
            {caption}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex h-10 w-full bg-ink-50/60 px-3 pr-8 py-2 appearance-none',
          'border border-ink-400 text-paper-0',
          'font-mono text-[13px] tracking-tight',
          'focus-visible:outline-none focus-visible:border-signal-400 focus-visible:ring-1 focus-visible:ring-signal-400/40'
        )}
      >
        {options.map((o) => (
          <option
            key={o.value || '__none'}
            value={o.value}
            className="bg-ink-100 text-paper-0"
          >
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-paper-500 font-mono text-[10px]">
        ▼
      </span>
    </div>
  );
}

/** Visualize the Shannon pipeline — gives the operator a sense of what
 *  hitting "Engage" actually kicks off. Stamped phases, amber index dots. */
function PipelinePanel() {
  const phases = [
    {
      code: 'P1',
      title: 'Pre‑recon',
      blurb: 'Source review + surface mapping from the repo.',
    },
    {
      code: 'P2',
      title: 'Reconnaissance',
      blurb: 'Crawl, endpoint discovery, framework fingerprinting.',
    },
    {
      code: 'P3',
      title: 'Analysis',
      blurb: 'Parallel agents: injection · XSS · auth · SSRF · authz.',
    },
    {
      code: 'P4',
      title: 'Exploitation',
      blurb: 'Conditional follow‑through on credible findings only.',
    },
    {
      code: 'P5',
      title: 'Report',
      blurb: 'Executive summary + reproducible steps per finding.',
    },
  ];

  return (
    <section className="border border-border bg-card">
      <header className="px-5 pt-4 pb-3 border-b border-border/60">
        <div className="label-stamp mb-1.5">// Pipeline</div>
        <h3 className="font-display text-[1.2rem] font-medium leading-none text-paper-0">
          What engage does
        </h3>
      </header>
      <ol className="p-5 space-y-4">
        {phases.map((p, i) => (
          <li key={p.code} className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="h-7 w-7 border border-signal-400/50 bg-signal-400/10 flex items-center justify-center font-mono text-[10px] font-semibold text-signal-300 tracking-[0.1em]">
                {p.code}
              </div>
              {i < phases.length - 1 && (
                <span className="w-px flex-1 bg-ink-400 mt-1" />
              )}
            </div>
            <div className="pb-4">
              <div className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-paper-0">
                {p.title}
              </div>
              <p className="mt-1 font-mono text-[11px] text-paper-500 leading-relaxed">
                {p.blurb}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
