/**
 * Login — the entry console. Split composition:
 *   left  = identity panel with tactical schematic
 *   right = authorization form
 * This is the most dramatic moment in the product, so we commit to it.
 */

import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Terminal, Lock, ArrowRight, AlertOctagon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clock, setClock] = useState(() => new Date().toISOString().slice(11, 19));

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    const id = window.setInterval(
      () => setClock(new Date().toISOString().slice(11, 19)),
      1000
    );
    return () => window.clearInterval(id);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Slow scanline — atmospheric, barely there. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-signal-400/[0.06] to-transparent animate-scan"
      />

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
        {/* ─────────────────── Left: identity panel ─────────────────── */}
        <section className="relative border-r border-border/60 bg-ink-0 overflow-hidden film-grain">
          {/* Tactical background grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(247, 241, 225, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(247, 241, 225, 0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div
            aria-hidden
            className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(245, 132, 26, 0.14) 0%, transparent 60%)',
              filter: 'blur(20px)',
            }}
          />

          {/* Top meta row */}
          <div className="relative flex items-center justify-between px-12 pt-10 text-paper-500">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center border border-signal-400/60 bg-signal-400/10">
                <Terminal className="h-3.5 w-3.5 text-signal-400" />
              </div>
              <span className="label-stamp-signal">Field Terminal</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] flex items-center gap-3">
              <span>
                <span className="text-ink-700">T+</span>{' '}
                <span className="text-paper-0 tabular-nums">{clock}Z</span>
              </span>
              <span className="h-px w-4 bg-ink-500" />
              <span>Ref 0xSHN-1</span>
            </div>
          </div>

          {/* Hero typography */}
          <div className="relative px-12 mt-24">
            <div className="label-stamp mb-4 animate-stamp-in" style={{ animationDelay: '0.1s' }}>
              // Access Restricted Console
            </div>
            <h1
              className="font-display text-[min(10vw,9rem)] font-medium leading-[0.9] text-paper-0 tracking-[-0.03em] animate-stamp-in"
              style={{ animationDelay: '0.25s' }}
            >
              Shannon
              <span className="inline-block w-3" />
              <span className="text-signal-400">.</span>
            </h1>
            <p
              className="mt-6 max-w-xl text-paper-400 text-[13px] leading-relaxed font-mono animate-stamp-in"
              style={{ animationDelay: '0.4s' }}
            >
              AI‑directed penetration testing, orchestrated under human command.
              Authenticate to resume your field operations.
            </p>

            {/* Tactical schematic — a stamped data block */}
            <div
              className="mt-14 grid grid-cols-3 gap-px bg-ink-400/50 max-w-xl animate-stamp-in"
              style={{ animationDelay: '0.55s' }}
            >
              {[
                { k: 'Channel', v: 'Temporal · gRPC' },
                { k: 'Engine', v: 'Anthropic · Claude' },
                { k: 'Protocol', v: 'SSH · HTTPS · SOCKS5' },
                { k: 'Clearance', v: 'Role-based' },
                { k: 'Session', v: 'HMAC · bcrypt' },
                { k: 'Uplink', v: 'Encrypted' },
              ].map((c) => (
                <div key={c.k} className="bg-ink-0 px-4 py-3">
                  <div className="label-stamp">{c.k}</div>
                  <div className="mt-1.5 font-mono text-[11px] text-paper-0 tracking-tight">
                    {c.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom rule with serial */}
          <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between text-paper-500">
            <div className="flex items-center gap-3">
              <span className="h-1 w-1 rounded-full bg-signal-400 animate-signal-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                Terminal Ready
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] tabular-nums">
              Serial · SHN / 00A / FT
            </span>
          </div>
        </section>

        {/* ─────────────────── Right: form panel ─────────────────── */}
        <section className="relative flex items-center justify-center px-8 py-16 bg-ink-50">
          <div className="w-full max-w-[420px]">
            {/* Stamped heading */}
            <div className="mb-10">
              <div className="label-stamp mb-3">// Step 01 · Authorize</div>
              <h2 className="font-display text-4xl font-medium text-paper-0 leading-tight">
                Sign in to continue.
              </h2>
              <p className="mt-3 font-mono text-[12px] text-paper-400 leading-relaxed">
                Your credentials open a signed session keyed to this device.
                All traffic is logged for operator audit.
              </p>
            </div>

            {/* Form panel */}
            <div className="relative border border-ink-400 bg-ink-100/40 panel-corners">
              <span className="corner-tl" />
              <span className="corner-br" />

              <form onSubmit={handleSubmit} className="p-7 space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertOctagon />
                    <AlertTitle>Authorization Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FieldRow
                  index="01"
                  label="Operator ID"
                  caption="Your assigned username"
                >
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="operator"
                    required
                    autoComplete="username"
                    autoFocus
                    disabled={isSubmitting}
                  />
                </FieldRow>

                <FieldRow
                  index="02"
                  label="Passphrase"
                  caption="bcrypt · cost 12"
                >
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                </FieldRow>

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full justify-between"
                    disabled={isSubmitting}
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      {isSubmitting ? 'Authenticating…' : 'Authorize Session'}
                    </span>
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="rule-dashed pt-4 text-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500">
                    Contact a SHN Admin if you've lost access
                  </span>
                </div>
              </form>
            </div>

            {/* Footer meta */}
            <div className="mt-8 flex items-center justify-between text-paper-500 font-mono text-[10px] uppercase tracking-[0.22em]">
              <span>© Shannon Ops</span>
              <span>Secure · AGPL-3.0</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function FieldRow({
  index,
  label,
  caption,
  children,
}: {
  index: string;
  label: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={label.toLowerCase().replace(/\s+/g, '-')}
          className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-paper-0 flex items-center gap-2"
        >
          <span className="text-signal-400 tabular-nums">{index}</span>
          <span className="h-px w-3 bg-ink-500" />
          {label}
        </label>
        {caption && (
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-700">
            {caption}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
