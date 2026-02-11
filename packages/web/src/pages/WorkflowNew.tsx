import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStartWorkflow, useConfigs } from '../api/hooks';
import { AlertCircle, Play, Loader2 } from 'lucide-react';

export default function WorkflowNew() {
  const navigate = useNavigate();
  const startWorkflow = useStartWorkflow();
  const { data: configsData } = useConfigs();

  const [webUrl, setWebUrl] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [configName, setConfigName] = useState('');
  const [pipelineTestingMode, setPipelineTestingMode] = useState(false);

  const configs = configsData?.configs || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await startWorkflow.mutateAsync({
        webUrl,
        repoPath,
        configName: configName || undefined,
        pipelineTestingMode,
      });

      navigate(`/workflows/${result.workflowId}`);
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Start New Pentest</h1>
        <p className="text-gray-500 mt-1">Configure and launch a penetration test workflow</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-6">
        {/* Target URL */}
        <div>
          <label htmlFor="webUrl" className="block text-sm font-medium text-gray-700 mb-1">
            Target URL <span className="text-red-500">*</span>
          </label>
          <input
            id="webUrl"
            type="url"
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-shannon-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            The web application URL to test
          </p>
        </div>

        {/* Repository Path */}
        <div>
          <label htmlFor="repoPath" className="block text-sm font-medium text-gray-700 mb-1">
            Repository Path <span className="text-red-500">*</span>
          </label>
          <input
            id="repoPath"
            type="text"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder="/path/to/source/code"
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-shannon-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Local path to the application's source code for static analysis
          </p>
        </div>

        {/* Configuration */}
        <div>
          <label htmlFor="configName" className="block text-sm font-medium text-gray-700 mb-1">
            Configuration (Optional)
          </label>
          <select
            id="configName"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-shannon-500"
          >
            <option value="">No configuration</option>
            {configs.map((config) => (
              <option key={config.name} value={config.name}>
                {config.name}
                {config.hasAuthentication ? ' (with auth)' : ''}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Select a configuration for authentication and testing rules
          </p>
        </div>

        {/* Testing Mode */}
        <div className="flex items-center gap-3">
          <input
            id="pipelineTestingMode"
            type="checkbox"
            checked={pipelineTestingMode}
            onChange={(e) => setPipelineTestingMode(e.target.checked)}
            className="w-4 h-4 text-shannon-600 rounded focus:ring-shannon-500"
          />
          <label htmlFor="pipelineTestingMode" className="text-sm text-gray-700">
            Pipeline testing mode (faster retries, minimal prompts)
          </label>
        </div>

        {/* Error */}
        {startWorkflow.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span>{(startWorkflow.error as Error).message || 'Failed to start workflow'}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={startWorkflow.isPending || !webUrl || !repoPath}
            className="flex items-center gap-2 px-4 py-2 bg-shannon-600 text-white rounded-lg hover:bg-shannon-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {startWorkflow.isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play size={20} />
                Start Pentest
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Pre-reconnaissance scans and source code analysis</li>
          <li>Reconnaissance and attack surface mapping</li>
          <li>Parallel vulnerability analysis (injection, XSS, auth, SSRF, authz)</li>
          <li>Conditional exploitation of discovered vulnerabilities</li>
          <li>Executive security report generation</li>
        </ul>
      </div>
    </div>
  );
}
