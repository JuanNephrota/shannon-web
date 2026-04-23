import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Lock,
  Minus,
  Plus,
  Save,
  Shield,
  SlidersHorizontal,
  Target,
  XOctagon,
} from 'lucide-react';
import { useSaveConfig } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  type LoginType,
  type RuleType,
  type ShannonConfig,
  type ShannonRule,
  type SuccessConditionType,
  toYaml,
  validate,
} from '@/lib/config-yaml';

/* ─────────────────────── local form state ─────────────────────── */

interface FormState {
  name: string;
  includeAuth: boolean;
  auth: {
    login_type: LoginType;
    login_url: string;
    credentials: {
      username: string;
      password: string;
      totp_secret: string;
    };
    login_flow: string[];
    success_condition: {
      type: SuccessConditionType;
      value: string;
    };
  };
  includeRules: boolean;
  avoid: ShannonRule[];
  focus: ShannonRule[];
}

const initialState: FormState = {
  name: '',
  includeAuth: true,
  auth: {
    login_type: 'form',
    login_url: '',
    credentials: { username: '', password: '', totp_secret: '' },
    login_flow: [
      'Type $username into the email field',
      'Type $password into the password field',
      "Click the 'Sign In' button",
    ],
    success_condition: { type: 'url', value: '/dashboard' },
  },
  includeRules: false,
  avoid: [],
  focus: [],
};

const emptyRule = (): ShannonRule => ({
  description: '',
  type: 'path',
  url_path: '',
});

const loginTypes: LoginType[] = ['form', 'sso', 'api', 'basic'];
const conditionTypes: SuccessConditionType[] = [
  'url',
  'cookie',
  'element',
  'redirect',
];
const ruleTypes: RuleType[] = [
  'path',
  'subdomain',
  'domain',
  'method',
  'header',
  'parameter',
];

/* ─────────────────────── component ─────────────────────── */

export default function ConfigBuilder() {
  const [state, setState] = useState<FormState>(initialState);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const save = useSaveConfig();
  const navigate = useNavigate();

  // Transform form state → schema shape for serialization/validation.
  const configObject = useMemo<ShannonConfig>(() => {
    const c: ShannonConfig = {};
    if (state.includeAuth) {
      c.authentication = {
        login_type: state.auth.login_type,
        login_url: state.auth.login_url,
        credentials: {
          username: state.auth.credentials.username,
          password: state.auth.credentials.password,
          totp_secret: state.auth.credentials.totp_secret || undefined,
        },
        login_flow: state.auth.login_flow.filter((s) => s.trim().length > 0),
        success_condition: { ...state.auth.success_condition },
      };
    }
    if (state.includeRules) {
      c.rules = {};
      if (state.avoid.length) c.rules.avoid = state.avoid;
      if (state.focus.length) c.rules.focus = state.focus;
    }
    return c;
  }, [state]);

  const yaml = useMemo(() => toYaml(configObject), [configObject]);

  const issues = useMemo(
    () =>
      validate(configObject, {
        includeAuth: state.includeAuth,
        includeRules: state.includeRules,
      }),
    [configObject, state.includeAuth, state.includeRules]
  );

  const nameValid = /^[a-z0-9][a-z0-9_-]{1,48}$/.test(state.name);
  const canSave = nameValid && issues.length === 0 && !save.isPending;

  const handleSave = async () => {
    setSubmitError(null);
    try {
      await save.mutateAsync({ name: state.name, content: yaml });
      navigate('/configs');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name || 'config'}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ───────── updater helpers ───────── */

  const setAuth = (patch: Partial<FormState['auth']>) =>
    setState((s) => ({ ...s, auth: { ...s.auth, ...patch } }));

  const setCreds = (patch: Partial<FormState['auth']['credentials']>) =>
    setState((s) => ({
      ...s,
      auth: {
        ...s.auth,
        credentials: { ...s.auth.credentials, ...patch },
      },
    }));

  const setFlow = (next: string[]) =>
    setState((s) => ({ ...s, auth: { ...s.auth, login_flow: next } }));

  const setSuccess = (patch: Partial<FormState['auth']['success_condition']>) =>
    setState((s) => ({
      ...s,
      auth: {
        ...s.auth,
        success_condition: { ...s.auth.success_condition, ...patch },
      },
    }));

  const setRules = (group: 'avoid' | 'focus', rules: ShannonRule[]) =>
    setState((s) => ({ ...s, [group]: rules }));

  return (
    <div className="space-y-10">
      {/* ─────────── Header ─────────── */}
      <header className="space-y-5">
        <Link
          to="/configs"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 hover:text-signal-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Configurations
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="label-stamp-signal mb-2 flex items-center gap-2">
              <SlidersHorizontal className="h-3 w-3" />
              // Guided Builder
            </div>
            <h1 className="font-display text-5xl font-medium leading-[0.95] text-paper-0 tracking-[-0.02em]">
              New configuration<span className="text-signal-400">.</span>
            </h1>
            <p className="mt-3 font-mono text-[13px] text-paper-400 max-w-2xl leading-relaxed">
              Draft a Shannon YAML config without hand‑editing. Toggle sections
              on, fill in the fields, watch the output render live, then save
              to the <code className="text-signal-300">configs/</code>{' '}
              directory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleDownload}
              disabled={issues.length > 0}
            >
              <Download className="h-4 w-4" />
              Download .yaml
            </Button>
            <Button size="lg" onClick={handleSave} disabled={!canSave}>
              <Save className="h-4 w-4" />
              {save.isPending ? 'Saving…' : 'Save to Configs'}
            </Button>
          </div>
        </div>
      </header>

      {/* ─────────── Body ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-8">
        {/* ───── Left: form ───── */}
        <div className="space-y-6">
          {/* File meta */}
          <Panel index="00" title="File" kicker="// Identity">
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <FieldRow
                label="File name"
                caption="a–z, 0–9, hyphens; no spaces"
              >
                <Input
                  value={state.name}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                    }))
                  }
                  placeholder="acme-production"
                />
              </FieldRow>
              <div className="pb-[10px] font-mono text-[11px] text-paper-500 tracking-tight whitespace-nowrap">
                <span className="text-ink-700">saves as </span>
                <span className={state.name ? 'text-signal-300' : 'text-ink-700'}>
                  {state.name || '<name>'}.yaml
                </span>
              </div>
            </div>
            {state.name && !nameValid && (
              <p className="mt-2 font-mono text-[11px] text-alert-400">
                Name must start with a letter or number and be 2–49 chars of{' '}
                <code>a–z 0–9 _ -</code>.
              </p>
            )}
          </Panel>

          {/* Authentication */}
          <Panel
            index="01"
            title="Authentication"
            kicker="// Section · Optional"
            icon={Shield}
            enabled={state.includeAuth}
            onToggle={(v) => setState((s) => ({ ...s, includeAuth: v }))}
            description="How Shannon should sign into the target before testing."
          >
            {state.includeAuth && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                  <FieldRow label="Login type" caption="form, sso, api, basic">
                    <SelectBox
                      value={state.auth.login_type}
                      onChange={(v) => setAuth({ login_type: v as LoginType })}
                      options={loginTypes}
                    />
                  </FieldRow>
                  <FieldRow label="Login URL" caption="https://…">
                    <Input
                      value={state.auth.login_url}
                      onChange={(e) => setAuth({ login_url: e.target.value })}
                      placeholder="https://example.com/login"
                    />
                  </FieldRow>
                </div>

                <Subheading>Credentials</Subheading>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FieldRow label="Username">
                    <Input
                      value={state.auth.credentials.username}
                      onChange={(e) => setCreds({ username: e.target.value })}
                      placeholder="testuser"
                    />
                  </FieldRow>
                  <FieldRow label="Password">
                    <Input
                      type="password"
                      value={state.auth.credentials.password}
                      onChange={(e) => setCreds({ password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </FieldRow>
                  <FieldRow label="TOTP Secret" caption="Optional · Base32">
                    <Input
                      value={state.auth.credentials.totp_secret}
                      onChange={(e) => setCreds({ totp_secret: e.target.value })}
                      placeholder="JBSWY3DPEHPK3PXP"
                    />
                  </FieldRow>
                </div>

                <Subheading
                  action={
                    <AddButton
                      label="Add step"
                      onClick={() =>
                        setFlow([
                          ...state.auth.login_flow,
                          '',
                        ])
                      }
                    />
                  }
                >
                  Login flow
                </Subheading>
                <p className="label-stamp -mt-3 mb-0">
                  Natural language. Use <span className="text-signal-300">$username</span>,{' '}
                  <span className="text-signal-300">$password</span>,{' '}
                  <span className="text-signal-300">$totp</span> as variables.
                </p>
                <ul className="space-y-2">
                  {state.auth.login_flow.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 group"
                    >
                      <span className="index-tag tabular-nums w-8 shrink-0">
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                      <Input
                        value={step}
                        onChange={(e) => {
                          const next = [...state.auth.login_flow];
                          next[i] = e.target.value;
                          setFlow(next);
                        }}
                        placeholder="Type $username into the email field"
                      />
                      <IconButton
                        label="Remove step"
                        onClick={() =>
                          setFlow(
                            state.auth.login_flow.filter((_, j) => j !== i)
                          )
                        }
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </IconButton>
                    </li>
                  ))}
                  {state.auth.login_flow.length === 0 && (
                    <li className="font-mono text-[11px] text-paper-500 italic">
                      No steps — Shannon will attempt a default form submit.
                    </li>
                  )}
                </ul>

                <Subheading>Success condition</Subheading>
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                  <FieldRow label="Check type">
                    <SelectBox
                      value={state.auth.success_condition.type}
                      onChange={(v) =>
                        setSuccess({ type: v as SuccessConditionType })
                      }
                      options={conditionTypes}
                    />
                  </FieldRow>
                  <FieldRow
                    label="Value"
                    caption={successCaption(state.auth.success_condition.type)}
                  >
                    <Input
                      value={state.auth.success_condition.value}
                      onChange={(e) =>
                        setSuccess({ value: e.target.value })
                      }
                      placeholder="/dashboard"
                    />
                  </FieldRow>
                </div>
              </div>
            )}
          </Panel>

          {/* Rules */}
          <Panel
            index="02"
            title="Rules"
            kicker="// Section · Optional"
            icon={Target}
            enabled={state.includeRules}
            onToggle={(v) => setState((s) => ({ ...s, includeRules: v }))}
            description="Scope the test — what to skip and what to prioritize."
          >
            {state.includeRules && (
              <div className="space-y-6">
                <RuleGroup
                  label="Avoid"
                  helper="Paths Shannon should steer clear of."
                  kicker="// Skip"
                  tone="alert"
                  rules={state.avoid}
                  onChange={(r) => setRules('avoid', r)}
                />
                <RuleGroup
                  label="Focus"
                  helper="Paths worth extra attention."
                  kicker="// Prioritize"
                  tone="signal"
                  rules={state.focus}
                  onChange={(r) => setRules('focus', r)}
                />
              </div>
            )}
          </Panel>

          {/* Validation + submit errors */}
          {issues.length > 0 && (
            <Alert variant="destructive">
              <XOctagon />
              <AlertTitle>Validation</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 space-y-1">
                  {issues.map((iss, i) => (
                    <li key={i} className="font-mono text-[12px]">
                      <span className="text-alert-400">[{iss.path}]</span>{' '}
                      {iss.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {submitError && (
            <Alert variant="destructive">
              <XOctagon />
              <AlertTitle>Save Failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* ───── Right: live preview ───── */}
        <aside className="xl:sticky xl:top-16 self-start">
          <div className="border border-border bg-ink-0 relative">
            {/* Preview chrome */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-signal-400" />
                <span className="label-stamp-signal">
                  // {state.name ? `${state.name}.yaml` : 'config.yaml'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <IconButton label="Copy" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-signal-300" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </IconButton>
              </div>
            </div>

            <YamlPreview yaml={yaml} />

            <div className="px-4 py-2 border-t border-border/70 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500">
                {yaml.split('\n').length - 1} lines · {yaml.length} bytes
              </span>
              <span
                className={cn(
                  'font-mono text-[10px] uppercase tracking-[0.22em] flex items-center gap-1.5',
                  issues.length === 0
                    ? 'text-go-400'
                    : 'text-alert-400'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    issues.length === 0 ? 'bg-go-400' : 'bg-alert-400'
                  )}
                />
                {issues.length === 0
                  ? 'Schema Valid'
                  : `${issues.length} issue${issues.length === 1 ? '' : 's'}`}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─────────────────────── YAML preview with line numbers ─────────────────────── */

function YamlPreview({ yaml }: { yaml: string }) {
  const lines = yaml.split('\n');
  // Drop trailing empty line that comes from the final \n
  if (lines[lines.length - 1] === '') lines.pop();

  return (
    <pre className="font-mono text-[12px] leading-[1.65] p-0 m-0 overflow-auto max-h-[72vh]">
      <code>
        {lines.map((raw, i) => (
          <div
            key={i}
            className="flex items-start hover:bg-signal-400/[0.04] group"
          >
            <span className="select-none text-ink-700 tabular-nums pr-3 pl-4 py-[1px] border-r border-border/50 w-10 text-right shrink-0">
              {i + 1}
            </span>
            <span className="pl-3 pr-4 py-[1px] whitespace-pre">
              {colorize(raw)}
            </span>
          </div>
        ))}
      </code>
    </pre>
  );
}

/** Tiny YAML colorizer — handles comments, keys, string values. */
function colorize(line: string): React.ReactNode {
  if (!line.trim()) return ' ';
  // Comment line
  if (/^\s*#/.test(line)) {
    return <span className="text-ink-700 italic">{line}</span>;
  }
  // Match leading indent, optional dash, key, colon, value
  const m = line.match(/^(\s*)(- )?([^:#\s][^:]*?):(.*)$/);
  if (m) {
    const [, indent, dash, key, rest] = m;
    return (
      <>
        <span>{indent}</span>
        {dash && <span className="text-signal-400">{dash}</span>}
        <span className="text-paper-0">{key}</span>
        <span className="text-ink-700">:</span>
        {colorizeValue(rest)}
      </>
    );
  }
  // Dash-only list item of a string
  const dashMatch = line.match(/^(\s*)(- )(.*)$/);
  if (dashMatch) {
    const [, indent, dash, rest] = dashMatch;
    return (
      <>
        <span>{indent}</span>
        <span className="text-signal-400">{dash}</span>
        {colorizeValue(rest)}
      </>
    );
  }
  return line;
}

function colorizeValue(v: string): React.ReactNode {
  const trimmed = v.trim();
  if (trimmed === '') return v;
  // quoted string
  if (/^".*"$/.test(trimmed)) {
    return <span className="text-signal-200">{v}</span>;
  }
  // number
  if (/^\s-?\d+(\.\d+)?$/.test(v)) {
    return <span className="text-wait-400">{v}</span>;
  }
  // boolean
  if (/^\s(true|false|null)$/i.test(v)) {
    return <span className="text-wait-400">{v}</span>;
  }
  return <span className="text-paper-0">{v}</span>;
}

/* ─────────────────────── sub-components ─────────────────────── */

function successCaption(t: SuccessConditionType): string {
  switch (t) {
    case 'url':
      return 'Substring of the post-login URL';
    case 'cookie':
      return 'Name of a cookie that must be set';
    case 'element':
      return 'CSS selector of an element that must exist';
    case 'redirect':
      return 'URL the login must redirect to';
  }
}

function Panel({
  index,
  title,
  kicker,
  description,
  icon: Icon,
  enabled,
  onToggle,
  children,
}: {
  index: string;
  title: string;
  kicker: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  enabled?: boolean;
  onToggle?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const toggleable = typeof onToggle === 'function';
  return (
    <section
      className={cn(
        'relative border bg-card',
        toggleable && enabled === false
          ? 'border-border/60 hatch'
          : 'border-border'
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-border/60">
        <div className="flex items-start gap-4">
          <span className="index-tag tabular-nums pt-1.5">[{index}]</span>
          <div>
            <div className="label-stamp mb-2">{kicker}</div>
            <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0 flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-signal-400" />}
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 font-mono text-[11px] text-paper-500 max-w-xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {toggleable && (
          <Toggle value={!!enabled} onChange={onToggle!} />
        )}
      </header>
      {enabled !== false && <div className="p-6">{children}</div>}
    </section>
  );
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.22em] transition-colors',
        value
          ? 'border-signal-400/60 text-signal-300 bg-signal-400/10 hover:bg-signal-400/15'
          : 'border-ink-400 text-paper-500 hover:border-paper-500'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          value ? 'bg-signal-400 animate-signal-pulse' : 'bg-ink-700'
        )}
      />
      {value ? 'Included' : 'Excluded'}
    </button>
  );
}

function FieldRow({
  label,
  caption,
  children,
}: {
  label: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-paper-0">
          {label}
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

function Subheading({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2">
      <span className="font-display text-[0.95rem] font-medium text-paper-0">
        {children}
      </span>
      {action}
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
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
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-ink-100 text-paper-0">
            {opt}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-paper-500 font-mono text-[10px]">
        ▼
      </span>
    </div>
  );
}

function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 border border-dashed',
        'border-ink-500 text-paper-400 font-mono text-[10px] uppercase tracking-[0.22em]',
        'hover:border-signal-400 hover:text-signal-300 transition-colors'
      )}
    >
      <Plus className="h-3 w-3" />
      {label}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'h-8 w-8 shrink-0 flex items-center justify-center',
        'border border-ink-400 text-paper-400',
        'hover:border-signal-400 hover:text-signal-300 transition-colors'
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────────── Rule group ─────────────────────── */

function RuleGroup({
  label,
  helper,
  kicker,
  tone,
  rules,
  onChange,
}: {
  label: string;
  helper: string;
  kicker: string;
  tone: 'signal' | 'alert';
  rules: ShannonRule[];
  onChange: (next: ShannonRule[]) => void;
}) {
  const toneBorder =
    tone === 'signal' ? 'border-signal-400/40' : 'border-alert-500/40';
  const toneText = tone === 'signal' ? 'text-signal-300' : 'text-alert-400';
  const toneDot = tone === 'signal' ? 'bg-signal-400' : 'bg-alert-400';

  return (
    <div className={cn('border bg-ink-0/40', toneBorder)}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <span className={cn('h-1.5 w-1.5 rounded-full', toneDot)} />
          <span
            className={cn(
              'font-mono text-[10px] uppercase tracking-[0.22em]',
              toneText
            )}
          >
            {kicker}
          </span>
          <span className="h-px w-6 bg-ink-500" />
          <span className="font-display text-[1rem] text-paper-0">{label}</span>
        </div>
        <AddButton
          label={`Add ${label.toLowerCase()} rule`}
          onClick={() => onChange([...rules, emptyRule()])}
        />
      </div>

      {rules.length === 0 ? (
        <p className="px-4 py-5 font-mono text-[11px] text-paper-500">
          {helper}
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {rules.map((rule, i) => (
            <li key={i} className="p-4 grid grid-cols-1 md:grid-cols-[24px_1fr_160px_1.4fr_32px] gap-3 items-end">
              <span className="index-tag tabular-nums pb-[10px] hidden md:block">
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <FieldRow label="Description">
                <Input
                  value={rule.description}
                  onChange={(e) => {
                    const next = [...rules];
                    next[i] = { ...rule, description: e.target.value };
                    onChange(next);
                  }}
                  placeholder="Skip logout functionality"
                />
              </FieldRow>
              <FieldRow label="Type">
                <SelectBox
                  value={rule.type}
                  onChange={(v) => {
                    const next = [...rules];
                    next[i] = { ...rule, type: v as RuleType };
                    onChange(next);
                  }}
                  options={ruleTypes}
                />
              </FieldRow>
              <FieldRow label="URL / Path">
                <Input
                  value={rule.url_path}
                  onChange={(e) => {
                    const next = [...rules];
                    next[i] = { ...rule, url_path: e.target.value };
                    onChange(next);
                  }}
                  placeholder="/logout"
                />
              </FieldRow>
              <div className="pb-[2px]">
                <IconButton
                  label="Remove rule"
                  onClick={() => onChange(rules.filter((_, j) => j !== i))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
