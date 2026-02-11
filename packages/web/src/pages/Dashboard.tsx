import { Link } from 'react-router-dom';
import { useWorkflows } from '@/api/hooks';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, ArrowRight, Clock, Activity, CheckCircle } from 'lucide-react';

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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and launch penetration tests</p>
        </div>
        <Button asChild>
          <Link to="/workflows/new">
            <Play className="h-4 w-4" />
            Start New Pentest
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">{runningWorkflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">
                  {workflows.filter((w) =>
                    w.status === 'completed' &&
                    new Date(w.startTime).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Running Workflows */}
      {runningWorkflows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Running Workflows</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {runningWorkflows.map((workflow) => (
                <Link
                  key={workflow.workflowId}
                  to={`/workflows/${workflow.workflowId}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{workflow.workflowId}</p>
                    {workflow.webUrl && (
                      <p className="text-sm text-muted-foreground">{workflow.webUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={workflow.status} />
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Workflows */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Recent Workflows</CardTitle>
          <Link to="/workflows" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">Failed to load workflows</div>
          ) : recentWorkflows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No workflows yet.</p>
              <Link to="/workflows/new" className="text-primary hover:underline">
                Start your first pentest
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentWorkflows.map((workflow) => (
                <Link
                  key={workflow.workflowId}
                  to={`/workflows/${workflow.workflowId}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{workflow.workflowId}</p>
                    <p className="text-sm text-muted-foreground">{formatTime(workflow.startTime)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={workflow.status} />
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
