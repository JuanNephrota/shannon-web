import { Link } from 'react-router-dom';
import { useWorkflows } from '../api/hooks';
import StatusBadge from '../components/StatusBadge';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';

export default function WorkflowList() {
  const { data, isLoading, error } = useWorkflows();
  const [search, setSearch] = useState('');

  const workflows = data?.workflows || [];
  const filteredWorkflows = workflows.filter(
    (w) =>
      w.workflowId.toLowerCase().includes(search.toLowerCase()) ||
      w.webUrl?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start: number, end?: number) => {
    const endTime = end || Date.now();
    const duration = endTime - start;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-500 mt-1">All penetration test workflows</p>
        </div>
        <Link
          to="/workflows/new"
          className="px-4 py-2 bg-shannon-600 text-white rounded-lg hover:bg-shannon-700 transition-colors"
        >
          New Workflow
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-shannon-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Failed to load workflows</div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? 'No workflows match your search' : 'No workflows yet'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Workflow ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Target</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Started</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Duration</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredWorkflows.map((workflow) => (
                <tr key={workflow.workflowId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">{workflow.workflowId}</span>
                  </td>
                  <td className="px-4 py-3">
                    {workflow.webUrl ? (
                      <a
                        href={workflow.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-shannon-600 hover:underline text-sm"
                      >
                        {workflow.webUrl}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={workflow.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatTime(workflow.startTime)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDuration(workflow.startTime, workflow.endTime)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/workflows/${workflow.workflowId}`}
                      className="flex items-center gap-1 text-shannon-600 hover:text-shannon-700"
                    >
                      View <ArrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
