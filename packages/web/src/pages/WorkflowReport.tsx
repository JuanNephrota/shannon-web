import { useParams, Link } from 'react-router-dom';
import { useDeliverables, useDeliverable } from '@/api/hooks';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download } from 'lucide-react';

export default function WorkflowReport() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const { data: deliverablesData } = useDeliverables(workflowId);

  const deliverables = deliverablesData?.deliverables || [];
  const reportFile = deliverables.find(
    (d) => d.type === 'report' && (d.name.includes('executive') || d.name.includes('report'))
  ) || deliverables.find((d) => d.type === 'report');

  const { data: reportContent, isLoading, error } = useDeliverable(
    workflowId,
    reportFile?.path
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !reportContent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Report not available</h2>
        <p className="text-muted-foreground mb-4">
          The report may not have been generated yet or the workflow is still running.
        </p>
        <Button variant="link" asChild>
          <Link to={`/workflows/${workflowId}`}>Back to workflow</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link to={`/workflows/${workflowId}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to workflow
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Security Report</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">{workflowId}</p>
        </div>

        {reportFile && (
          <Button variant="outline" asChild>
            <a
              href={`/api/workflows/${workflowId}/deliverables/${reportFile.path}`}
              download
            >
              <Download className="h-4 w-4" />
              Download Markdown
            </a>
          </Button>
        )}
      </div>

      {/* Report Content */}
      <Card>
        <CardContent className="p-8">
          <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-foreground prose-a:text-primary prose-code:text-foreground prose-pre:bg-muted">
            <ReactMarkdown>{reportContent}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
