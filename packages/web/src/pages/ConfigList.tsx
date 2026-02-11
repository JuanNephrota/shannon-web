import { useConfigs, useDeleteConfig } from '@/api/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Trash2, Shield, Filter, Info } from 'lucide-react';

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
          <h1 className="text-3xl font-bold tracking-tight">Configurations</h1>
          <p className="text-muted-foreground mt-1">Manage authentication and testing configurations</p>
        </div>
      </div>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configuration files are stored in the <code className="bg-muted px-1 rounded text-sm">configs/</code> directory.
          Edit them directly or use the YAML editor below.
        </AlertDescription>
      </Alert>

      {/* Config List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">Failed to load configurations</div>
          ) : configs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p>No configurations found</p>
              <p className="text-sm mt-1">
                Create a YAML file in the <code className="bg-muted px-1 rounded">configs/</code> directory to get started
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {configs.map((config) => (
                <div key={config.name} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{config.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {config.hasAuthentication && (
                          <Badge variant="success" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Authentication
                          </Badge>
                        )}
                        {config.hasRules && (
                          <Badge variant="secondary" className="text-xs">
                            <Filter className="h-3 w-3 mr-1" />
                            Rules
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Modified {formatDate(config.lastModified)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(config.name)}
                    disabled={deleteConfig.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schema Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Configuration files support the following sections:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Authentication</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Login type (form, SSO, API, basic)</li>
                <li>- Login URL</li>
                <li>- Credentials (username, password, TOTP)</li>
                <li>- Login flow steps</li>
                <li>- Success condition</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Rules</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Avoid rules (URLs to skip)</li>
                <li>- Focus rules (URLs to prioritize)</li>
                <li>- Path, subdomain, or domain patterns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
