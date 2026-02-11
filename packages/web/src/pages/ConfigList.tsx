import { useConfigs, useDeleteConfig } from '../api/hooks';
import { Settings, Trash2, Shield, Filter, Loader2 } from 'lucide-react';

export default function ConfigList() {
  const { data, isLoading, error } = useConfigs();
  const deleteConfig = useDeleteConfig();

  const configs = data?.configs || [];

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteConfig.mutateAsync(name);
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurations</h1>
          <p className="text-gray-500 mt-1">Manage authentication and testing configurations</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Configuration files are stored in the <code className="bg-blue-100 px-1 rounded">configs/</code> directory.
          Edit them directly or use the YAML editor below.
        </p>
      </div>

      {/* Config List */}
      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-shannon-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Failed to load configurations</div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>No configurations found</p>
            <p className="text-sm mt-1">
              Create a YAML file in the <code>configs/</code> directory to get started
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {configs.map((config) => (
              <div key={config.name} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Settings className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {config.hasAuthentication && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Shield size={12} />
                          Authentication
                        </span>
                      )}
                      {config.hasRules && (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Filter size={12} />
                          Rules
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        Modified {formatDate(config.lastModified)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(config.name)}
                    disabled={deleteConfig.isPending}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete configuration"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schema Info */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration Schema</h2>
        <p className="text-gray-600 mb-4">
          Configuration files support the following sections:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Authentication</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>- Login type (form, SSO, API, basic)</li>
              <li>- Login URL</li>
              <li>- Credentials (username, password, TOTP)</li>
              <li>- Login flow steps</li>
              <li>- Success condition</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Rules</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>- Avoid rules (URLs to skip)</li>
              <li>- Focus rules (URLs to prioritize)</li>
              <li>- Path, subdomain, or domain patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
