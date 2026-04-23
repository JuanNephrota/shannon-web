import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Play,
  FileCode,
  List,
  Loader2,
  Key,
  ExternalLink,
  Users as UsersIcon,
  LogOut,
  Terminal,
} from 'lucide-react';
import { useWorkerStatus, useStartWorker, useStopWorker } from '@/api/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  path: string;
  label: string;
  code: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', code: '01', icon: LayoutDashboard },
  { path: '/workflows', label: 'Workflows', code: '02', icon: List },
  { path: '/workflows/new', label: 'New Pentest', code: '03', icon: Play },
  { path: '/configs', label: 'Configs', code: '04', icon: FileCode },
  { path: '/settings', label: 'Settings', code: '05', icon: Key },
];

const adminNav: NavItem = {
  path: '/users',
  label: 'Users',
  code: '06',
  icon: UsersIcon,
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { data: workerStatus } = useWorkerStatus();
  const startWorker = useStartWorker();
  const stopWorker = useStopWorker();
  const { user, isAdmin, logout } = useAuth();

  const isWorkerRunning = workerStatus?.running ?? false;
  const isLoading = startWorker.isPending || stopWorker.isPending;

  const handleWorkerToggle = () => {
    if (isWorkerRunning) {
      stopWorker.mutate();
    } else {
      startWorker.mutate();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Active nav = longest-prefix match of the current pathname, with an
  // exact-match fast path. Without this, `/workflows` would also light up
  // when we're on `/workflows/new` because the child path extends it.
  const allItems = [...navItems, ...(isAdmin ? [adminNav] : [])];
  const activePath = (() => {
    const exact = allItems.find((i) => i.path === location.pathname);
    if (exact) return exact.path;
    return allItems
      .filter(
        (i) =>
          i.path !== '/' &&
          (location.pathname === i.path ||
            location.pathname.startsWith(i.path + '/'))
      )
      .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  })();

  const renderNavLink = (item: NavItem) => {
    const isActive = item.path === activePath;
    const Icon = item.icon;

    return (
      <li key={item.path} className="relative">
        <Link
          to={item.path}
          className={cn(
            "group relative flex items-center gap-3 pl-6 pr-4 py-2.5",
            "font-mono text-[11px] uppercase tracking-[0.18em]",
            "border-l-2 transition-[color,background,border-color,transform] duration-150",
            isActive
              ? "border-signal-400 bg-signal-400/[0.06] text-signal-200"
              : "border-transparent text-paper-400 hover:text-paper-0 hover:border-ink-500 hover:bg-ink-200/40"
          )}
        >
          <span
            className={cn(
              "text-[9px] tracking-[0.2em] tabular-nums",
              isActive ? "text-signal-400" : "text-ink-700"
            )}
          >
            [{item.code}]
          </span>
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{item.label}</span>
          {isActive && (
            <span className="ml-auto h-1 w-1 rounded-full bg-signal-400 animate-signal-pulse" />
          )}
        </Link>
      </li>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ──────────────────────── Sidebar: device shell ──────────────────────── */}
      <aside
        className={cn(
          "w-72 shrink-0 flex flex-col",
          "bg-ink-0 border-r border-ink-400/60 relative",
          "before:pointer-events-none before:absolute before:inset-y-0 before:right-0 before:w-px before:bg-paper-0/[0.03]"
        )}
      >
        {/* ── Header stamp ── */}
        <div className="relative px-6 pt-6 pb-5 border-b border-ink-400/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center border border-signal-400/60 bg-signal-400/10">
              <Terminal className="h-3 w-3 text-signal-400" />
            </div>
            <span className="label-stamp-signal">Field Terminal</span>
          </div>
          <h1 className="font-display text-[2rem] leading-none font-medium text-paper-0 tracking-tight">
            Shannon
          </h1>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono tracking-[0.14em] uppercase text-paper-500">
            <span>v1.0</span>
            <span className="h-px w-3 bg-ink-500" />
            <span>AI Pentest OPS</span>
          </div>
        </div>

        {/* ── Section label ── */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <span className="label-stamp">// Console</span>
          <span className="index-tag tabular-nums">
            {navItems.length + (isAdmin ? 1 : 0)} routes
          </span>
        </div>

        <nav className="flex-1">
          <ul className="flex flex-col">
            {navItems.map(renderNavLink)}
            {isAdmin && (
              <>
                <li className="px-6 pt-5 pb-2 flex items-center justify-between">
                  <span className="label-stamp">// Admin</span>
                </li>
                {renderNavLink(adminNav)}
              </>
            )}
          </ul>
        </nav>

        {/* ── Worker telemetry panel ── */}
        <div className="mx-4 mb-3 border border-ink-400/80 bg-ink-100/40 relative">
          <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-ink-400/60">
            <span className="label-stamp">// Worker</span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em]">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isWorkerRunning
                    ? "bg-signal-400 animate-signal-pulse"
                    : "bg-ink-700"
                )}
              />
              <span className={isWorkerRunning ? "text-signal-300" : "text-paper-500"}>
                {isWorkerRunning ? "ONLINE" : "OFFLINE"}
              </span>
            </span>
          </div>
          <div className="px-3 py-2.5 flex items-center justify-between">
            <div className="font-mono text-[10px] text-paper-500 tracking-[0.1em]">
              {workerStatus?.pid ? (
                <>
                  <span className="text-ink-700">pid</span>{' '}
                  <span className="text-paper-0 tabular-nums">
                    {workerStatus.pid}
                  </span>
                </>
              ) : (
                <span className="text-ink-700">pid —</span>
              )}
            </div>
            <button
              onClick={handleWorkerToggle}
              disabled={isLoading}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 border transition-colors",
                "font-mono text-[10px] uppercase tracking-[0.18em]",
                "disabled:opacity-50 disabled:pointer-events-none",
                isWorkerRunning
                  ? "border-alert-500/50 text-alert-400 hover:bg-alert-500/10"
                  : "border-signal-400/60 text-signal-300 hover:bg-signal-400/10"
              )}
            >
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              {isLoading
                ? isWorkerRunning
                  ? "Halting"
                  : "Booting"
                : isWorkerRunning
                  ? "Halt"
                  : "Boot"}
            </button>
          </div>
        </div>

        {/* ── External: Temporal console ── */}
        <a
          href="http://localhost:8233"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mx-4 mb-3 px-3 py-2 border border-dashed border-ink-500",
            "flex items-center justify-between",
            "font-mono text-[10px] uppercase tracking-[0.18em] text-paper-500",
            "hover:border-signal-400/60 hover:text-signal-300 transition-colors"
          )}
        >
          <span>Temporal Console</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* ── Operator block ── */}
        <div className="border-t border-ink-400/60 px-4 py-4 flex items-center gap-3">
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 flex-1 min-w-0 group -mx-1 px-1 py-1",
              "hover:bg-ink-200/50 transition-colors"
            )}
            title="View profile"
          >
            <div
              className={cn(
                "h-10 w-10 shrink-0 border border-ink-400 bg-ink-200",
                "flex items-center justify-center transition-colors",
                "font-mono text-[14px] font-semibold text-signal-300 uppercase",
                "group-hover:border-signal-400/60"
              )}
            >
              {user?.username?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[12px] text-paper-0 truncate group-hover:text-signal-200 transition-colors">
                {user?.username}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "inline-block h-1 w-1 rounded-full",
                    isAdmin ? "bg-signal-400" : "bg-go-400"
                  )}
                />
                <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-paper-500">
                  {isAdmin ? 'Admin Clearance' : 'Operator'}
                </span>
              </div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className={cn(
              "h-8 w-8 flex items-center justify-center",
              "border border-ink-400 text-paper-400",
              "hover:border-alert-500/60 hover:text-alert-400 transition-colors"
            )}
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* ──────────────────────── Main: field ──────────────────────── */}
      <main className="flex-1 overflow-auto relative">
        {/* Top chrome: a thin status rail with session meta */}
        <div
          className={cn(
            "sticky top-0 z-10 flex items-center justify-between",
            "px-10 h-10 border-b border-border/80",
            "bg-ink-50/85 backdrop-blur-sm",
            "font-mono text-[10px] uppercase tracking-[0.2em] text-paper-500"
          )}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-400 animate-signal-pulse" />
              <span className="text-signal-300">Live</span>
            </span>
            <span className="h-px w-6 bg-ink-500" />
            <span>
              session{' '}
              <span className="text-paper-0 tabular-nums">
                {user?.username ?? '—'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              <span className="text-ink-700">T+</span>{' '}
              <span className="text-paper-0 tabular-nums">
                {new Date().toISOString().slice(11, 19)}Z
              </span>
            </span>
          </div>
        </div>

        <div className="px-10 py-10 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
