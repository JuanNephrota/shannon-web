import { useState } from 'react';
import { useSettings, useUpdateApiKeys, useTestApiKey } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Key, CheckCircle, XCircle, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface ApiKeyFieldProps {
  label: string;
  provider: string;
  currentValue: string | null;
  onSave: (value: string) => void;
  isSaving: boolean;
}

function ApiKeyField({ label, provider, currentValue, onSave, isSaving }: ApiKeyFieldProps) {
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const testKey = useTestApiKey();

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
      setValue('');
      setIsEditing(false);
    }
  };

  const handleTest = async () => {
    if (value.trim()) {
      testKey.mutate({ provider, apiKey: value.trim() });
    }
  };

  const handleClear = () => {
    onSave('');
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{label}</span>
          </div>
          {currentValue && !isEditing && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Configured
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter API key..."
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {testKey.data && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  testKey.data.valid ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {testKey.data.valid ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    API key is valid
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    {testKey.data.error || 'Invalid API key'}
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!value.trim() || testKey.isPending}
              >
                {testKey.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Key'
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!value.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setValue('');
                  testKey.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-muted-foreground">
              {currentValue || 'Not configured'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {currentValue ? 'Change' : 'Add'}
              </Button>
              {currentValue && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isSaving}
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { data: settings, isLoading, error } = useSettings();
  const updateApiKeys = useUpdateApiKeys();

  const handleSaveKey = (keyName: string) => (value: string) => {
    updateApiKeys.mutate({ [keyName]: value || undefined });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load settings</h2>
        <p className="text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure API keys and preferences</p>
      </div>

      {/* Warning if no Anthropic key */}
      {!settings?.hasAnthropicKey && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Anthropic API Key Required</AlertTitle>
          <AlertDescription>
            Shannon requires an Anthropic API key to run pentests. Add your key below to get started.
          </AlertDescription>
        </Alert>
      )}

      {/* API Keys */}
      <div>
        <h2 className="text-lg font-semibold mb-4">API Keys</h2>
        <div className="space-y-4">
          <ApiKeyField
            label="Anthropic API Key"
            provider="anthropic"
            currentValue={settings?.apiKeys.anthropicApiKey ?? null}
            onSave={handleSaveKey('anthropicApiKey')}
            isSaving={updateApiKeys.isPending}
          />

          <ApiKeyField
            label="OpenAI API Key"
            provider="openai"
            currentValue={settings?.apiKeys.openaiApiKey ?? null}
            onSave={handleSaveKey('openaiApiKey')}
            isSaving={updateApiKeys.isPending}
          />

          <ApiKeyField
            label="OpenRouter API Key"
            provider="openrouter"
            currentValue={settings?.apiKeys.openrouterApiKey ?? null}
            onSave={handleSaveKey('openrouterApiKey')}
            isSaving={updateApiKeys.isPending}
          />
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              <strong>Anthropic:</strong> Required for running pentests. Get a key at{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
            </li>
            <li>
              <strong>OpenAI:</strong> Optional. Used with router mode for alternative models.
            </li>
            <li>
              <strong>OpenRouter:</strong> Optional. Provides access to multiple LLM providers.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Storage notice */}
      <p className="text-xs text-muted-foreground">
        API keys are stored locally in <code className="bg-muted px-1 rounded">.shannon-settings.json</code> and are not committed to git.
      </p>
    </div>
  );
}
