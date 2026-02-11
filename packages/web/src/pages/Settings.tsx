import { useState } from 'react';
import { useSettings, useUpdateApiKeys, useTestApiKey } from '../api/hooks';
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
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Key size={18} className="text-gray-400" />
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        {currentValue && !isEditing && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle size={14} />
            Configured
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showValue ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter API key..."
              className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-shannon-500 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowValue(!showValue)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {testKey.data && (
            <div
              className={`flex items-center gap-2 text-sm ${
                testKey.data.valid ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {testKey.data.valid ? (
                <>
                  <CheckCircle size={14} />
                  API key is valid
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  {testKey.data.error || 'Invalid API key'}
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={!value.trim() || testKey.isPending}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {testKey.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Key'
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={!value.trim() || isSaving}
              className="px-3 py-1.5 text-sm bg-shannon-600 text-white rounded-lg hover:bg-shannon-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setValue('');
                testKey.reset();
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-gray-500">
            {currentValue || 'Not configured'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
            >
              {currentValue ? 'Change' : 'Add'}
            </button>
            {currentValue && (
              <button
                onClick={handleClear}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-shannon-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load settings</h2>
        <p className="text-gray-500">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure API keys and preferences</p>
      </div>

      {/* Warning if no Anthropic key */}
      {!settings?.hasAnthropicKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900">Anthropic API Key Required</h3>
            <p className="text-sm text-amber-700 mt-1">
              Shannon requires an Anthropic API key to run pentests. Add your key below to get started.
            </p>
          </div>
        </div>
      )}

      {/* API Keys */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>
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
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">About API Keys</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>
            <strong>Anthropic:</strong> Required for running pentests. Get a key at{' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-shannon-600 hover:underline"
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
      </div>

      {/* Storage notice */}
      <p className="text-xs text-gray-400">
        API keys are stored locally in <code className="bg-gray-100 px-1 rounded">.shannon-settings.json</code> and are not committed to git.
      </p>
    </div>
  );
}
