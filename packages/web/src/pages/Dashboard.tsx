import { Link } from 'react-router-dom';
import { useWorkflows } from '../api/hooks';
import StatusBadge from '../components/StatusBadge';
import { Play, ArrowRight, Clock, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading, error } = useWorkflows();

  const workflows = data?.workflows || [];
  const runningWorkflows = workflows.filter((w) => w.status === 'running');
  const recentWorkflows = workflows.slice(0, 5);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor and launch penetration tests</p>
        </div>
        <Link
          to="/workflows/new"
          className="flex items-center gap-2 px-4 py-2 bg-shannon-600 text-white rounded-lg hover:bg-shannon-700 transition-colors"
        >
          <Play size={20} />
          Start New Pentest
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Running</p>
              <p className="text-2xl font-bold">{runningWorkflows.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Workflows</p>
              <p className="text-2xl font-bold">{workflows.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold">
                {workflows.filter((w) =>
                  w.status === 'completed' &&
                  new Date(w.startTime).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Running Workflows */}
      {runningWorkflows.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Running Workflows</h2>
          </div>
          <div className="divide-y">
            {runningWorkflows.map((workflow) => (
              <Link
                key={workflow.workflowId}
                to={`/workflows/${workflow.workflowId}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{workflow.workflowId}</p>
                  {workflow.webUrl && (
                    <p className="text-sm text-gray-500">{workflow.webUrl}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={workflow.status} />
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workflows */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Workflows</h2>
          <Link to="/workflows" className="text-sm text-shannon-600 hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Failed to load workflows</div>
        ) : recentWorkflows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No workflows yet.</p>
            <Link to="/workflows/new" className="text-shannon-600 hover:underline">
              Start your first pentest
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentWorkflows.map((workflow) => (
              <Link
                key={workflow.workflowId}
                to={`/workflows/${workflow.workflowId}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{workflow.workflowId}</p>
                  <p className="text-sm text-gray-500">{formatTime(workflow.startTime)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={workflow.status} />
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
