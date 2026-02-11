import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStartWorkflow, useConfigs } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Play, Loader2, Info } from 'lucide-react';

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
        <h1 className="text-3xl font-bold tracking-tight">Start New Pentest</h1>
        <p className="text-muted-foreground mt-1">Configure and launch a penetration test workflow</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target URL */}
            <div className="space-y-2">
              <Label htmlFor="webUrl">
                Target URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="webUrl"
                type="url"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
              <p className="text-sm text-muted-foreground">
                The web application URL to test
              </p>
            </div>

            {/* Repository Path */}
            <div className="space-y-2">
              <Label htmlFor="repoPath">
                Repository Path <span className="text-destructive">*</span>
              </Label>
              <Input
                id="repoPath"
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="/path/to/source/code"
                required
              />
              <p className="text-sm text-muted-foreground">
                Local path to the application's source code for static analysis
              </p>
            </div>

            {/* Configuration */}
            <div className="space-y-2">
              <Label htmlFor="configName">Configuration (Optional)</Label>
              <Select value={configName} onValueChange={setConfigName}>
                <SelectTrigger>
                  <SelectValue placeholder="No configuration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No configuration</SelectItem>
                  {configs.map((config) => (
                    <SelectItem key={config.name} value={config.name}>
                      {config.name}
                      {config.hasAuthentication ? ' (with auth)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select a configuration for authentication and testing rules
              </p>
            </div>

            {/* Testing Mode */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pipelineTestingMode"
                checked={pipelineTestingMode}
                onCheckedChange={(checked) => setPipelineTestingMode(checked === true)}
              />
              <Label htmlFor="pipelineTestingMode" className="font-normal cursor-pointer">
                Pipeline testing mode (faster retries, minimal prompts)
              </Label>
            </div>

            {/* Error */}
            {startWorkflow.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(startWorkflow.error as Error).message || 'Failed to start workflow'}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={startWorkflow.isPending || !webUrl || !repoPath}
              >
                {startWorkflow.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Pentest
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong className="block mb-2">What happens next?</strong>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Pre-reconnaissance scans and source code analysis</li>
            <li>Reconnaissance and attack surface mapping</li>
            <li>Parallel vulnerability analysis (injection, XSS, auth, SSRF, authz)</li>
            <li>Conditional exploitation of discovered vulnerabilities</li>
            <li>Executive security report generation</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
