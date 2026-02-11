import { Link } from 'react-router-dom';
import { useWorkflows } from '@/api/hooks';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Search, ExternalLink, Plus } from 'lucide-react';
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
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-1">All penetration test workflows</p>
        </div>
        <Button asChild>
          <Link to="/workflows/new">
            <Plus className="h-4 w-4" />
            New Workflow
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">Failed to load workflows</div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search ? 'No workflows match your search' : 'No workflows yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow ID</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.workflowId}>
                    <TableCell className="font-mono text-sm">
                      {workflow.workflowId}
                    </TableCell>
                    <TableCell>
                      {workflow.webUrl ? (
                        <a
                          href={workflow.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {workflow.webUrl}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={workflow.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(workflow.startTime)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDuration(workflow.startTime, workflow.endTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/workflows/${workflow.workflowId}`}>
                            View
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <a
                          href={`http://localhost:8233/namespaces/default/workflows/${workflow.workflowId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground p-2"
                          title="Open in Temporal UI"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
