import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Play, FileCode, List, Server, Loader2, Key } from 'lucide-react';
import { useWorkerStatus, useStartWorker, useStopWorker } from '../api/hooks';

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-shannon-400">Shannon</h1>
          <p className="text-sm text-gray-400 mt-1">AI Penetration Testing</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-shannon-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Worker Status */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-gray-400" />
              <span className="text-sm text-gray-300">Worker</span>
            </div>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                isWorkerRunning
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {isWorkerRunning ? 'Running' : 'Stopped'}
            </span>
          </div>

          <button
            onClick={handleWorkerToggle}
            disabled={isLoading}
            className={`w-full px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isWorkerRunning
                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {isWorkerRunning ? 'Stopping...' : 'Starting...'}
              </>
            ) : (
              <>
                {isWorkerRunning ? 'Stop Worker' : 'Start Worker'}
              </>
            )}
          </button>

          {workerStatus?.pid && (
            <p className="text-xs text-gray-500 mt-2">PID: {workerStatus.pid}</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 text-sm text-gray-500">
          <p>Temporal UI: <a href="http://localhost:8233" target="_blank" rel="noopener noreferrer" className="text-shannon-400 hover:underline">localhost:8233</a></p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
