/**
 * Hand-rolled YAML serializer for the Shannon pentest config schema.
 * Kept narrow on purpose — we know exactly which shapes appear here.
 *
 * Schema (per /Users/pmarsh/scripts/shannon/configs/config-schema.json):
 *   authentication?:
 *     login_type: 'form' | 'sso' | 'api' | 'basic'
 *     login_url: string
 *     credentials: { username, password, totp_secret? }
 *     login_flow?: string[]        # natural-language steps
 *     success_condition: { type, value }
 *   rules?:
 *     avoid?: Rule[]
 *     focus?: Rule[]
 *   Rule: { description, type, url_path }
 */

export type LoginType = 'form' | 'sso' | 'api' | 'basic';
export type SuccessConditionType = 'url' | 'cookie' | 'element' | 'redirect';
export type RuleType =
  | 'path'
  | 'subdomain'
  | 'domain'
  | 'method'
  | 'header'
  | 'parameter';

export interface ShannonRule {
  description: string;
  type: RuleType;
  url_path: string;
}

export interface ShannonConfig {
  authentication?: {
    login_type: LoginType;
    login_url: string;
    credentials: {
      username: string;
      password: string;
      totp_secret?: string;
    };
    login_flow?: string[];
    success_condition: {
      type: SuccessConditionType;
      value: string;
    };
  };
  rules?: {
    avoid?: ShannonRule[];
    focus?: ShannonRule[];
  };
}

/* ──────────────────── quoting ──────────────────── */

/**
 * Decide whether a scalar needs quoting. We quote defensively for any value
 * that contains: a control char, a colon-space, hash, quote, newline, leading
 * sigil, purely numeric look, boolean-like words, or starts/ends with spaces.
 * That covers the footguns YAML hands you with "7" vs 7 or "no" vs false.
 */
function needsQuotes(value: string): boolean {
  if (value.length === 0) return true;
  if (value !== value.trim()) return true;
  if (/[:#\n\r\t"'`,\[\]\{\}&*!|>%@]/.test(value)) return true;
  if (/^[\-\?]/.test(value)) return true; // block indicators
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(value)) return true;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) return true; // numeric-ish
  return false;
}

function quote(value: string): string {
  // Prefer double quotes and escape the two chars that matter inside them.
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function scalar(value: string): string {
  return needsQuotes(value) ? quote(value) : value;
}

/* ──────────────────── emitters ──────────────────── */

function indent(depth: number): string {
  return '  '.repeat(depth);
}

/** Emit a key:value line, with the value as a block (empty string for parent). */
function line(depth: number, key: string, value = ''): string {
  return `${indent(depth)}${key}:${value ? ' ' + value : ''}`;
}

/** Emit an inline comment line. */
function comment(depth: number, text: string): string {
  return `${indent(depth)}# ${text}`;
}

/** Emit a map of simple key/string pairs. Skips undefined/empty optionals. */
function emitStringMap(
  depth: number,
  entries: Array<[string, string | undefined]>
): string[] {
  const out: string[] = [];
  for (const [k, v] of entries) {
    if (v === undefined || v === '') continue;
    out.push(line(depth, k, scalar(v)));
  }
  return out;
}

/** Emit an array of strings as a block sequence. */
function emitStringArray(depth: number, items: string[]): string[] {
  return items
    .filter((s) => s.length > 0)
    .map((s) => `${indent(depth)}- ${scalar(s)}`);
}

/** Emit a rule block sequence. */
function emitRules(depth: number, rules: ShannonRule[]): string[] {
  const out: string[] = [];
  rules.forEach((r, i) => {
    // First key on the dash line, subsequent keys indented one extra.
    out.push(`${indent(depth)}- ${`description: ${scalar(r.description)}`}`);
    out.push(`${indent(depth + 1)}type: ${scalar(r.type)}`);
    out.push(`${indent(depth + 1)}url_path: ${scalar(r.url_path)}`);
    if (i < rules.length - 1) out.push('');
  });
  return out;
}

/* ──────────────────── public API ──────────────────── */

/**
 * Serialize a Shannon config object to YAML. Missing or incomplete sections
 * are omitted entirely — the server schema requires `authentication` OR
 * `rules` (or both), so an empty return means the form is not yet valid.
 */
export function toYaml(config: ShannonConfig): string {
  const out: string[] = [];
  out.push('# Shannon pentest configuration');
  out.push('# Generated via the guided config builder');
  out.push('');

  // ── authentication ──
  if (config.authentication) {
    const a = config.authentication;
    out.push('authentication:');
    out.push(...emitStringMap(1, [
      ['login_type', a.login_type],
      ['login_url', a.login_url],
    ]));

    out.push(line(1, 'credentials'));
    out.push(...emitStringMap(2, [
      ['username', a.credentials.username],
      ['password', a.credentials.password],
      ['totp_secret', a.credentials.totp_secret],
    ]));

    if (a.login_flow && a.login_flow.filter(Boolean).length > 0) {
      out.push('');
      out.push(comment(1, 'Natural-language instructions for the login flow.'));
      out.push(comment(1, 'Use $username / $password / $totp as variable markers.'));
      out.push(line(1, 'login_flow'));
      out.push(...emitStringArray(2, a.login_flow));
    }

    out.push('');
    out.push(line(1, 'success_condition'));
    out.push(...emitStringMap(2, [
      ['type', a.success_condition.type],
      ['value', a.success_condition.value],
    ]));
  }

  // ── rules ──
  const avoidRules = config.rules?.avoid?.filter(validRule) ?? [];
  const focusRules = config.rules?.focus?.filter(validRule) ?? [];
  if (avoidRules.length > 0 || focusRules.length > 0) {
    if (out[out.length - 1] !== '') out.push('');
    out.push('rules:');

    if (avoidRules.length > 0) {
      out.push(line(1, 'avoid'));
      out.push(...emitRules(2, avoidRules));
    }
    if (focusRules.length > 0) {
      if (avoidRules.length > 0) out.push('');
      out.push(line(1, 'focus'));
      out.push(...emitRules(2, focusRules));
    }
  }

  return out.join('\n') + '\n';
}

export function validRule(r: ShannonRule): boolean {
  return (
    r.description.trim().length > 0 &&
    r.url_path.trim().length > 0 &&
    !!r.type
  );
}

/* ──────────────────── validation ──────────────────── */

export interface ValidationIssue {
  path: string;
  message: string;
}

/**
 * Light-touch validation. Matches the JSON schema's required/shape rules for
 * the fields the UI actually collects. Returns an empty array when valid.
 */
export function validate(
  config: ShannonConfig,
  opts: { includeAuth: boolean; includeRules: boolean }
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!opts.includeAuth && !opts.includeRules) {
    issues.push({
      path: 'root',
      message: 'Configuration must include at least authentication or rules.',
    });
  }

  if (opts.includeAuth && config.authentication) {
    const a = config.authentication;
    if (!a.login_url.trim()) {
      issues.push({ path: 'authentication.login_url', message: 'Login URL is required.' });
    } else {
      try {
        new URL(a.login_url);
      } catch {
        issues.push({ path: 'authentication.login_url', message: 'Login URL must be a valid URL.' });
      }
    }
    if (!a.credentials.username.trim()) {
      issues.push({ path: 'authentication.credentials.username', message: 'Username is required.' });
    }
    if (!a.credentials.password.trim()) {
      issues.push({ path: 'authentication.credentials.password', message: 'Password is required.' });
    }
    if (a.credentials.totp_secret && !/^[A-Za-z2-7]+=*$/.test(a.credentials.totp_secret)) {
      issues.push({
        path: 'authentication.credentials.totp_secret',
        message: 'TOTP secret must be Base32 (A–Z, 2–7).',
      });
    }
    if (!a.success_condition.value.trim()) {
      issues.push({
        path: 'authentication.success_condition.value',
        message: 'Success condition value is required.',
      });
    }
  }

  if (opts.includeRules) {
    const avoid = config.rules?.avoid ?? [];
    const focus = config.rules?.focus ?? [];
    [...avoid, ...focus].forEach((r, i) => {
      if (!r.description.trim()) {
        issues.push({ path: `rules[${i}].description`, message: 'Description is required.' });
      }
      if (!r.url_path.trim()) {
        issues.push({ path: `rules[${i}].url_path`, message: 'URL path is required.' });
      }
    });

    if (
      opts.includeRules &&
      avoid.filter(validRule).length === 0 &&
      focus.filter(validRule).length === 0 &&
      !opts.includeAuth
    ) {
      issues.push({
        path: 'rules',
        message: 'Add at least one rule to the avoid or focus list.',
      });
    }
  }

  return issues;
}
