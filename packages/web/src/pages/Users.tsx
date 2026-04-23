/**
 * Users management page. Admin-only.
 *
 * Lists users with per-row actions: reset password, toggle admin,
 * disable/enable, delete. The inline confirmation pattern keeps
 * destructive actions one click behind a visible "are you sure".
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  ArrowUpRight,
  Check,
  KeyRound,
  Plus,
  Power,
  Shield,
  ShieldOff,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  X,
  XOctagon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, type User } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '@/lib/utils';

export function Users() {
  const { user: me } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Per-row pending states (by user id → action)
  const [pending, setPending] = useState<Record<string, string | null>>({});

  // Create-user form
  const [showCreate, setShowCreate] = useState(false);

  // Reset-password modal target
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const { users } = await api.listUsers();
      setUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const setBusy = (id: string, action: string | null) =>
    setPending((p) => ({ ...p, [id]: action }));

  /** Small wrapper around API mutations: show notice / error, refresh. */
  const run = async (
    id: string,
    action: string,
    fn: () => Promise<unknown>,
    successMsg: string
  ) => {
    setBusy(id, action);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(successMsg);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(id, null);
    }
  };

  const enabledAdminCount = useMemo(
    () => users.filter((u) => u.isAdmin && !u.disabled).length,
    [users]
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-5">
        <div className="label-stamp-signal animate-stamp-in flex items-center gap-2">
          <UsersIcon className="h-3 w-3" />
          // Directory
        </div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1
              className="font-display text-5xl font-medium leading-[0.95] text-paper-0 tracking-[-0.02em] animate-stamp-in"
              style={{ animationDelay: '0.1s' }}
            >
              Operator directory<span className="text-signal-400">.</span>
            </h1>
            <p
              className="mt-3 font-mono text-[13px] text-paper-400 leading-relaxed animate-stamp-in"
              style={{ animationDelay: '0.2s' }}
            >
              Manage who can sign in to Shannon, who has admin clearance, and
              reset passwords on behalf of operators who've lost access.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowCreate((v) => !v)}
            className="animate-stamp-in"
            style={{ animationDelay: '0.3s' }}
          >
            {showCreate ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                New Operator
              </>
            )}
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertOctagon />
          <AlertTitle>Action Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && !error && (
        <Alert variant="signal">
          <Check />
          <AlertTitle>// OK</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {showCreate && (
        <CreateUserForm
          onCreated={async (username) => {
            setShowCreate(false);
            setNotice(`Created "${username}"`);
            await refresh();
          }}
          onError={setError}
        />
      )}

      {/* Users table */}
      <section className="border border-border bg-card">
        <header className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/60">
          <div>
            <div className="label-stamp mb-1.5">// Roster</div>
            <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0">
              All operators
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper-500 tabular-nums">
            {users.length} {users.length === 1 ? 'user' : 'users'} ·{' '}
            {enabledAdminCount} admin
          </span>
        </header>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <span className="label-stamp text-paper-500">// Empty</span>
            <p className="mt-3 font-mono text-[13px] text-paper-0">
              No operators registered.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[40px_1fr_1fr_160px_140px_auto] items-center gap-5 px-6 py-2 border-b border-border/40 bg-ink-0/40">
              <ColHead />
              <ColHead>Operator</ColHead>
              <ColHead>Email</ColHead>
              <ColHead>Role</ColHead>
              <ColHead>Last Login</ColHead>
              <ColHead className="text-right">Actions</ColHead>
            </div>
            <ul className="divide-y divide-border/40">
              {users.map((user, i) => {
                const isSelf = user.id === me?.id;
                const isLastAdmin =
                  user.isAdmin && !user.disabled && enabledAdminCount <= 1;
                const busyAction = pending[user.id] ?? null;
                return (
                  <li
                    key={user.id}
                    className={cn(
                      'group grid grid-cols-1 md:grid-cols-[40px_1fr_1fr_160px_140px_auto]',
                      'items-center gap-x-5 gap-y-1 px-6 py-4',
                      user.disabled && 'opacity-60'
                    )}
                  >
                    <span className="index-tag tabular-nums">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>

                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'h-8 w-8 shrink-0 border flex items-center justify-center font-mono text-[12px] font-semibold uppercase',
                          user.isAdmin && !user.disabled
                            ? 'border-signal-400/60 bg-signal-400/10 text-signal-300'
                            : 'border-ink-400 bg-ink-200 text-paper-400'
                        )}
                      >
                        {user.username.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono text-[12px] text-paper-0 tracking-tight truncate">
                          {user.username}
                          {isSelf && (
                            <span className="ml-2 text-ink-700 text-[10px] uppercase tracking-[0.22em]">
                              · you
                            </span>
                          )}
                        </div>
                        {user.disabled && (
                          <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-alert-400">
                            disabled
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="font-mono text-[11px] text-paper-400 truncate">
                      {user.email || <span className="text-ink-700">—</span>}
                    </span>

                    <span>
                      <RoleBadge isAdmin={user.isAdmin} disabled={user.disabled} />
                    </span>

                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper-500 tabular-nums">
                      {user.lastLoginAt
                        ? fmtDate(user.lastLoginAt)
                        : <span className="text-ink-700">never</span>}
                    </span>

                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Toggle admin */}
                      <IconAction
                        label={user.isAdmin ? 'Demote to user' : 'Promote to admin'}
                        onClick={() =>
                          run(
                            user.id,
                            'role',
                            () =>
                              api.updateUser(user.id, { isAdmin: !user.isAdmin }),
                            user.isAdmin
                              ? `${user.username} is now a standard user`
                              : `${user.username} is now an admin`
                          )
                        }
                        disabled={
                          busyAction != null ||
                          (isSelf && user.isAdmin) || // can't demote self
                          (user.isAdmin && isLastAdmin)
                        }
                        tone={user.isAdmin ? 'default' : 'signal'}
                        busy={busyAction === 'role'}
                      >
                        {user.isAdmin ? (
                          <ShieldOff className="h-3.5 w-3.5" />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                      </IconAction>

                      {/* Reset password */}
                      <IconAction
                        label="Reset password"
                        onClick={() => setResetTarget(user)}
                        disabled={busyAction != null}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </IconAction>

                      {/* Disable / enable */}
                      <IconAction
                        label={user.disabled ? 'Enable account' : 'Disable account'}
                        onClick={() =>
                          run(
                            user.id,
                            'disable',
                            () =>
                              api.updateUser(user.id, {
                                disabled: !user.disabled,
                              }),
                            user.disabled
                              ? `${user.username} re-enabled`
                              : `${user.username} disabled`
                          )
                        }
                        disabled={
                          busyAction != null ||
                          isSelf || // can't disable yourself
                          (!user.disabled && user.isAdmin && isLastAdmin)
                        }
                        tone={user.disabled ? 'signal' : 'default'}
                        busy={busyAction === 'disable'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </IconAction>

                      {/* Delete */}
                      <DeleteAction
                        onConfirm={() =>
                          run(
                            user.id,
                            'delete',
                            () => api.deleteUser(user.id),
                            `${user.username} deleted`
                          )
                        }
                        disabled={
                          busyAction != null ||
                          isSelf ||
                          (user.isAdmin && isLastAdmin)
                        }
                        title={
                          isSelf
                            ? 'Cannot delete yourself'
                            : user.isAdmin && isLastAdmin
                              ? 'Cannot delete the last admin'
                              : 'Delete user'
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {/* Guidance */}
      <section className="border border-border bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/80">
          <GuidanceCard
            kicker="// Self-service"
            title="Let operators update themselves"
            body={
              <>
                For password changes and profile edits, send operators to the
                Profile page — they don't need admin to update their own details.
              </>
            }
            action={
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-signal-300 hover:text-signal-200 border-b border-signal-400/40 hover:border-signal-300 pb-0.5 transition-colors"
              >
                Open Profile
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          />
          <GuidanceCard
            kicker="// Disabling"
            title="Disable before you delete"
            body={
              <>
                Disabling keeps the account in the registry and terminates any
                active session on the next request, but preserves audit logs
                attributed to that operator. Delete only when an account is
                truly unwanted.
              </>
            }
          />
        </div>
      </section>

      {/* Reset password modal */}
      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onError={setError}
          onSuccess={(msg) => {
            setNotice(msg);
            setResetTarget(null);
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────── row helpers ─────────────────────── */

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

function RoleBadge({
  isAdmin,
  disabled,
}: {
  isAdmin: boolean;
  disabled: boolean;
}) {
  const label = disabled
    ? 'Disabled'
    : isAdmin
      ? 'Admin'
      : 'Operator';
  const dot = disabled
    ? 'bg-alert-400'
    : isAdmin
      ? 'bg-signal-400 animate-signal-pulse'
      : 'bg-go-400';
  const frame = disabled
    ? 'border-alert-500/50 text-alert-400 bg-alert-500/5'
    : isAdmin
      ? 'border-signal-400/60 text-signal-300 bg-signal-400/10'
      : 'border-go-500/40 text-go-400 bg-go-500/5';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-[3px]',
        'font-mono text-[10px] font-medium uppercase tracking-[0.22em] leading-none',
        frame
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}

function IconAction({
  children,
  label,
  onClick,
  disabled,
  busy,
  tone = 'default',
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone?: 'default' | 'signal' | 'alert';
}) {
  const toneClass = {
    default:
      'border-ink-400 text-paper-400 hover:border-signal-400 hover:text-signal-300',
    signal:
      'border-signal-400/60 text-signal-300 bg-signal-400/10 hover:bg-signal-400/15',
    alert:
      'border-alert-500/60 text-alert-400 hover:bg-alert-500/10',
  }[tone];

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        'h-8 w-8 shrink-0 flex items-center justify-center border transition-colors',
        toneClass,
        (disabled || busy) && 'opacity-40 pointer-events-none'
      )}
    >
      {busy ? (
        <span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-signal-pulse" />
      ) : (
        children
      )}
    </button>
  );
}

function DeleteAction({
  onConfirm,
  disabled,
  title,
}: {
  onConfirm: () => void;
  disabled?: boolean;
  title: string;
}) {
  const [arming, setArming] = useState(false);

  if (arming) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-alert-400 mr-1">
          Sure?
        </span>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            'h-8 px-2 border border-alert-500/60 text-alert-400 bg-alert-500/10',
            'font-mono text-[10px] uppercase tracking-[0.22em]',
            'hover:bg-alert-500/20 transition-colors'
          )}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => setArming(false)}
          className={cn(
            'h-8 w-8 flex items-center justify-center border border-ink-400 text-paper-400',
            'hover:border-signal-400 hover:text-signal-300 transition-colors'
          )}
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <IconAction
      label={title}
      onClick={() => setArming(true)}
      disabled={disabled}
      tone="alert"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </IconAction>
  );
}

/* ─────────────────────── create-user form ─────────────────────── */

function CreateUserForm({
  onCreated,
  onError,
}: {
  onCreated: (username: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createUser({
        username,
        password,
        email: email || undefined,
        isAdmin,
      });
      await onCreated(username);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-border bg-card">
      <header className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-border/60">
        <span className="index-tag tabular-nums pt-1.5">[+]</span>
        <div>
          <div className="label-stamp mb-2">// New Operator</div>
          <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-signal-400" />
            Register credentials
          </h2>
        </div>
      </header>
      <form onSubmit={handle} className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Username"
            required
            caption="a–z 0–9 _ - · 3–50 chars"
          >
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="operator"
              required
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z0-9_-]+$"
              disabled={busy}
            />
          </Field>
          <Field label="Email" caption="Optional">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@agency.ops"
              disabled={busy}
            />
          </Field>
        </div>
        <Field label="Password" required caption="Min 8 chars · bcrypt · cost 12">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            required
            minLength={8}
            maxLength={100}
            disabled={busy}
          />
        </Field>
        <label className="flex items-start gap-3 cursor-pointer group">
          <Checkbox
            id="create-isadmin"
            checked={isAdmin}
            onCheckedChange={(c) => setIsAdmin(c === true)}
            disabled={busy}
            className="mt-[2px]"
          />
          <span>
            <span className="block font-mono text-[11px] uppercase tracking-[0.22em] text-paper-0">
              Admin clearance
            </span>
            <span className="block mt-1 font-mono text-[11px] text-paper-500 leading-relaxed">
              Admins can register / edit / delete operators and change settings.
            </span>
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? 'Creating…' : (
              <>
                <Plus className="h-4 w-4" />
                Create Operator
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}

/* ─────────────────────── reset-password modal ─────────────────────── */

function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
  onError,
}: {
  user: User;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (pw !== confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    if (pw.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    setBusy(true);
    try {
      await api.resetPassword(user.id, pw);
      onSuccess(`Password reset for ${user.username}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-0/75 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md border border-signal-400/40 bg-card">
        <header className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border/60">
          <div>
            <div className="label-stamp-signal mb-2 flex items-center gap-2">
              <KeyRound className="h-3 w-3" />
              // Reset Password
            </div>
            <h2 className="font-display text-[1.4rem] font-medium leading-none text-paper-0">
              Set a new passphrase
            </h2>
            <p className="mt-1.5 font-mono text-[11px] text-paper-500">
              For operator{' '}
              <span className="text-paper-0">{user.username}</span>. The operator
              remains signed in on any device that already had a session; hand
              them the new password out-of-band.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center border border-ink-400 text-paper-400 hover:border-signal-400 hover:text-signal-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        <form onSubmit={submit} className="p-6 space-y-5">
          {localError && (
            <Alert variant="destructive">
              <XOctagon />
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}
          <Field label="New password" required caption="Min 8 chars">
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              minLength={8}
              maxLength={100}
              required
              disabled={busy}
            />
          </Field>
          <Field label="Confirm" required>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              maxLength={100}
              required
              disabled={busy}
            />
          </Field>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Resetting…' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────── small shared ─────────────────────── */

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

function GuidanceCard({
  kicker,
  title,
  body,
  action,
}: {
  kicker: string;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-ink-100/60 p-6">
      <div className="label-stamp mb-3">{kicker}</div>
      <h3 className="font-display text-[1.15rem] font-medium text-paper-0 leading-tight mb-2">
        {title}
      </h3>
      <p className="font-mono text-[12px] text-paper-400 leading-relaxed">{body}</p>
      {action && <div className="mt-4">{action}</div>}
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
