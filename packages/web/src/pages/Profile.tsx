/**
 * Profile — self-service page for the signed-in operator.
 *
 * Lets an operator edit their email and change their password without
 * needing admin to intervene.
 */

import { useState, type FormEvent } from 'react';
import {
  AlertOctagon,
  Check,
  KeyRound,
  Mail,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

export default function Profile() {
  const { user, refreshUser } = useAuth();

  if (!user) return null; // ProtectedRoute guarantees this

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-5">
        <div className="label-stamp-signal flex items-center gap-2 animate-stamp-in">
          <UserCircle className="h-3 w-3" />
          // Account
        </div>
        <div className="max-w-3xl">
          <h1
            className="font-display text-5xl font-medium leading-[0.95] text-paper-0 tracking-[-0.02em] animate-stamp-in"
            style={{ animationDelay: '0.1s' }}
          >
            Your profile<span className="text-signal-400">.</span>
          </h1>
          <p
            className="mt-3 font-mono text-[13px] text-paper-400 leading-relaxed animate-stamp-in"
            style={{ animationDelay: '0.2s' }}
          >
            Update your contact email and rotate your passphrase. Admins see
            this page too — self-service is always available.
          </p>
        </div>
      </header>

      {/* Identity tile */}
      <section className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 border border-border bg-card p-6">
        <div
          className="h-20 w-20 border border-signal-400/40 bg-signal-400/10 flex items-center justify-center font-display font-medium text-[2rem] text-signal-300 uppercase"
          aria-hidden
        >
          {user.username.slice(0, 1)}
        </div>
        <div className="space-y-3 min-w-0">
          <div>
            <div className="label-stamp mb-1">// Callsign</div>
            <div className="font-display text-2xl text-paper-0 leading-tight">
              {user.username}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em]">
            <Fact label="Clearance" value={
              <span className="flex items-center gap-1.5">
                <ShieldCheck
                  className={
                    user.isAdmin ? 'h-3 w-3 text-signal-400' : 'h-3 w-3 text-go-400'
                  }
                />
                <span className={user.isAdmin ? 'text-signal-300' : 'text-go-400'}>
                  {user.isAdmin ? 'Admin' : 'Operator'}
                </span>
              </span>
            } />
            <Fact
              label="Created"
              value={<span className="tabular-nums">{fmtDate(user.createdAt)}</span>}
            />
            <Fact
              label="Last Login"
              value={
                user.lastLoginAt
                  ? <span className="tabular-nums">{fmtDate(user.lastLoginAt)}</span>
                  : <span className="text-ink-700">never</span>
              }
            />
          </div>
        </div>
      </section>

      {/* Email form */}
      <EmailForm
        currentEmail={user.email ?? ''}
        onSaved={refreshUser}
      />

      {/* Password form */}
      <PasswordForm />
    </div>
  );
}

/* ─────────────────────── email ─────────────────────── */

function EmailForm({
  currentEmail,
  onSaved,
}: {
  currentEmail: string;
  onSaved: () => Promise<void>;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const dirty = email !== currentEmail;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    setBusy(true);
    try {
      await api.updateProfile({ email: email ? email : null });
      await onSaved();
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-border bg-card">
      <header className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-border/60">
        <span className="index-tag tabular-nums pt-1.5">[01]</span>
        <div>
          <div className="label-stamp mb-2">// Contact</div>
          <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0 flex items-center gap-2">
            <Mail className="h-4 w-4 text-signal-400" />
            Contact email
          </h2>
          <p className="mt-1.5 font-mono text-[11px] text-paper-500">
            Used for admin notifications. Leave blank to clear.
          </p>
        </div>
      </header>
      <form onSubmit={submit} className="p-6 space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertOctagon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {ok && (
          <Alert variant="signal">
            <Check />
            <AlertTitle>// Saved</AlertTitle>
            <AlertDescription>Email updated.</AlertDescription>
          </Alert>
        )}
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@agency.ops"
            disabled={busy}
          />
        </Field>
        <div className="flex items-center justify-end pt-2 border-t border-border/60">
          <Button type="submit" disabled={!dirty || busy}>
            {busy ? 'Saving…' : 'Save email'}
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ─────────────────────── password ─────────────────────── */

function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (next !== confirm) {
      setError('New passwords do not match');
      return;
    }
    if (next.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (next === current) {
      setError('New password must differ from current');
      return;
    }

    setBusy(true);
    try {
      await api.changeOwnPassword(current, next);
      setOk(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-border bg-card">
      <header className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-border/60">
        <span className="index-tag tabular-nums pt-1.5">[02]</span>
        <div>
          <div className="label-stamp mb-2">// Passphrase</div>
          <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-signal-400" />
            Change passphrase
          </h2>
          <p className="mt-1.5 font-mono text-[11px] text-paper-500">
            Confirm your current passphrase, then supply a new one. Existing
            sessions remain valid until they expire.
          </p>
        </div>
      </header>
      <form onSubmit={submit} className="p-6 space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertOctagon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {ok && (
          <Alert variant="signal">
            <Check />
            <AlertTitle>// Updated</AlertTitle>
            <AlertDescription>
              Your passphrase has been rotated.
            </AlertDescription>
          </Alert>
        )}
        <Field label="Current passphrase" required>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
            disabled={busy}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="New passphrase" required caption="Min 8 characters">
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={100}
              required
              disabled={busy}
            />
          </Field>
          <Field label="Confirm new" required>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={100}
              required
              disabled={busy}
            />
          </Field>
        </div>
        <div className="flex items-center justify-end pt-2 border-t border-border/60">
          <Button type="submit" disabled={busy}>
            {busy ? 'Rotating…' : 'Rotate passphrase'}
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ─────────────────────── small ─────────────────────── */

function Field({
  label,
  caption,
  required,
  children,
}: {
  label: string;
  caption?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-paper-0">
          {label}
          {required && <span className="text-signal-400 ml-1">*</span>}
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

function Fact({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="label-stamp mb-1">{label}</div>
      <div className="font-mono text-[12px] text-paper-0 normal-case tracking-normal">
        {value}
      </div>
    </div>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toISOString().slice(0, 10);
}
