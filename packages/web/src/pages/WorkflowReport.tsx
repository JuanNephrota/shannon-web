import { useParams, Link } from 'react-router-dom';
import { useDeliverables, useDeliverable } from '../api/hooks';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-shannon-600 animate-spin" />
      </div>
    );
  }

  if (error || !reportContent) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Report not available</h2>
        <p className="text-gray-500 mb-4">
          The report may not have been generated yet or the workflow is still running.
        </p>
        <Link to={`/workflows/${workflowId}`} className="text-shannon-600 hover:underline">
          Back to workflow
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/workflows/${workflowId}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft size={16} />
            Back to workflow
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Security Report</h1>
          <p className="text-gray-500 mt-1 font-mono text-sm">{workflowId}</p>
        </div>

        {reportFile && (
          <a
            href={`/api/workflows/${workflowId}/deliverables/${reportFile.path}`}
            download
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={20} />
            Download Markdown
          </a>
        )}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg border p-8">
        <article className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-shannon-600 prose-code:text-gray-800 prose-pre:bg-gray-900">
          <ReactMarkdown>{reportContent}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
