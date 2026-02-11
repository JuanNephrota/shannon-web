import { useParams, Link } from 'react-router-dom';
import { useWorkflow, useDeliverables, useCancelWorkflow } from '@/api/hooks';
import StatusBadge from '@/components/StatusBadge';
import AgentProgress from '@/components/AgentProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, Download, XCircle, Clock, DollarSign, Cpu, ExternalLink, AlertCircle } from 'lucide-react';

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Workflow not found</h2>
        <p className="text-muted-foreground mb-4">The workflow may have been deleted or the ID is invalid.</p>
        <Button variant="link" asChild>
          <Link to="/workflows">Back to workflows</Link>
        </Button>
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
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link to="/workflows">
              <ArrowLeft className="h-4 w-4" />
              Back to workflows
            </Link>
          </Button>
          <h1 className="text-2xl font-bold font-mono">{workflow.workflowId}</h1>
          <div className="flex items-center gap-4 mt-2">
            <StatusBadge status={workflow.status} />
            {workflow.currentPhase && workflow.status === 'running' && (
              <span className="text-sm text-muted-foreground">
                Phase: <span className="font-medium">{workflow.currentPhase}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <a
              href={`http://localhost:8233/namespaces/default/workflows/${workflowId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Temporal UI
            </a>
          </Button>

          {reports.length > 0 && (
            <Button asChild>
              <Link to={`/workflows/${workflowId}/report`}>
                <FileText className="h-4 w-4" />
                View Report
              </Link>
            </Button>
          )}

          {workflow.status === 'running' && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelWorkflow.isPending}
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {workflow.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {workflow.error}
            {workflow.failedAgent && (
              <span className="block mt-1 text-sm">Failed agent: {workflow.failedAgent}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Elapsed Time</p>
                <p className="text-lg font-semibold">{formatDuration(workflow.elapsedMs)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Cpu className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Agents</p>
                <p className="text-lg font-semibold">{workflow.completedAgents.length} / 13</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-lg font-semibold">{formatCost(totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deliverables</p>
                <p className="text-lg font-semibold">{deliverables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Progress */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Agent Progress</h2>
        <AgentProgress
          completedAgents={workflow.completedAgents}
          currentAgent={workflow.currentAgent}
          failedAgent={workflow.failedAgent}
          agentMetrics={workflow.agentMetrics}
        />
      </div>

      {/* Deliverables */}
      {deliverables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {deliverables.map((deliverable) => (
                <div key={deliverable.path} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{deliverable.name}</p>
                      <p className="text-sm text-muted-foreground">{deliverable.type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`/api/workflows/${workflowId}/deliverables/${deliverable.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
