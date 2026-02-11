import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Play, FileCode, List, Server, Loader2, Key, ExternalLink } from 'lucide-react';
import { useWorkerStatus, useStartWorker, useStopWorker } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/workflows', label: 'Workflows', icon: List },
  { path: '/workflows/new', label: 'New Pentest', icon: Play },
  { path: '/configs', label: 'Configs', icon: FileCode },
  { path: '/settings', label: 'Settings', icon: Key },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { data: workerStatus } = useWorkerStatus();
  const startWorker = useStartWorker();
  const stopWorker = useStopWorker();

  const isWorkerRunning = workerStatus?.running ?? false;
  const isLoading = startWorker.isPending || stopWorker.isPending;

  const handleWorkerToggle = () => {
    if (isWorkerRunning) {
      stopWorker.mutate();
    } else {
      startWorker.mutate();
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-primary">Shannon</h1>
          <p className="text-sm text-slate-400 mt-1">AI Penetration Testing</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium",
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Worker Status */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">Worker</span>
            </div>
            <Badge
              variant={isWorkerRunning ? "success" : "secondary"}
              className={cn(
                "text-xs",
                isWorkerRunning
                  ? "bg-green-900/50 text-green-400 border-green-800"
                  : "bg-slate-700 text-slate-400 border-slate-600"
              )}
            >
              {isWorkerRunning ? 'Running' : 'Stopped'}
            </Badge>
          </div>

          <Button
            onClick={handleWorkerToggle}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className={cn(
              "w-full",
              isWorkerRunning
                ? 'border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300'
                : 'border-green-800 text-green-400 hover:bg-green-900/30 hover:text-green-300'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isWorkerRunning ? 'Stopping...' : 'Starting...'}
              </>
            ) : (
              isWorkerRunning ? 'Stop Worker' : 'Start Worker'
            )}
          </Button>

          {workerStatus?.pid && (
            <p className="text-xs text-slate-500 mt-2">PID: {workerStatus.pid}</p>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <a
            href="http://localhost:8233"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Temporal UI
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
