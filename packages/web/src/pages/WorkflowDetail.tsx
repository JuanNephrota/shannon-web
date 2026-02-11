import { useParams, Link } from 'react-router-dom';
import { useWorkflow, useDeliverables, useCancelWorkflow } from '../api/hooks';
import StatusBadge from '../components/StatusBadge';
import AgentProgress from '../components/AgentProgress';
import { ArrowLeft, FileText, Download, XCircle, Clock, DollarSign, Cpu, Loader2 } from 'lucide-react';

export default function WorkflowDetail() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { data: workflow, isLoading, error } = useWorkflow(workflowId);
  const { data: deliverablesData } = useDeliverables(workflowId);
  const cancelWorkflow = useCancelWorkflow();

  const deliverables = deliverablesData?.deliverables || [];
  const reports = deliverables.filter((d) => d.type === 'report');

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const handleCancel = async () => {
    if (!workflowId) return;
    if (!confirm('Are you sure you want to cancel this workflow?')) return;

    try {
      await cancelWorkflow.mutateAsync(workflowId);
    } catch (error) {
      console.error('Failed to cancel workflow:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-shannon-600 animate-spin" />
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Workflow not found</h2>
        <p className="text-gray-500 mb-4">The workflow may have been deleted or the ID is invalid.</p>
        <Link to="/workflows" className="text-shannon-600 hover:underline">
          Back to workflows
        </Link>
      </div>
    );
  }

  const totalCost = Object.values(workflow.agentMetrics).reduce(
    (sum, m) => sum + (m.costUsd || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/workflows"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft size={16} />
            Back to workflows
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{workflow.workflowId}</h1>
          <div className="flex items-center gap-4 mt-2">
            <StatusBadge status={workflow.status} />
            {workflow.currentPhase && workflow.status === 'running' && (
              <span className="text-sm text-gray-500">
                Phase: <span className="font-medium">{workflow.currentPhase}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {reports.length > 0 && (
            <Link
              to={`/workflows/${workflowId}/report`}
              className="flex items-center gap-2 px-4 py-2 bg-shannon-600 text-white rounded-lg hover:bg-shannon-700 transition-colors"
            >
              <FileText size={20} />
              View Report
            </Link>
          )}

          {workflow.status === 'running' && (
            <button
              onClick={handleCancel}
              disabled={cancelWorkflow.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle size={20} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {workflow.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-1">Error</h3>
          <p className="text-red-700">{workflow.error}</p>
          {workflow.failedAgent && (
            <p className="text-sm text-red-600 mt-2">Failed agent: {workflow.failedAgent}</p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Elapsed Time</p>
              <p className="text-lg font-semibold">{formatDuration(workflow.elapsedMs)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Cpu className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Agents</p>
              <p className="text-lg font-semibold">{workflow.completedAgents.length} / 13</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-lg font-semibold">{formatCost(totalCost)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Deliverables</p>
              <p className="text-lg font-semibold">{deliverables.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Progress */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Progress</h2>
        <AgentProgress
          completedAgents={workflow.completedAgents}
          currentAgent={workflow.currentAgent}
          failedAgent={workflow.failedAgent}
          agentMetrics={workflow.agentMetrics}
        />
      </div>

      {/* Deliverables */}
      {deliverables.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Deliverables</h2>
          </div>
          <div className="divide-y">
            {deliverables.map((deliverable) => (
              <div key={deliverable.path} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{deliverable.name}</p>
                    <p className="text-sm text-gray-500">{deliverable.type}</p>
                  </div>
                </div>
                <a
                  href={`/api/workflows/${workflowId}/deliverables/${deliverable.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-shannon-600 hover:text-shannon-700"
                >
                  <Download size={16} />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
