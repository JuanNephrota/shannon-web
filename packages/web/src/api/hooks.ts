import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, StartWorkflowInput, ApiKeysInput } from './client';

// Workflow hooks
export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.listWorkflows(),
    refetchInterval: 10000, // Refresh every 10s
  });
}

export function useWorkflow(workflowId: string | undefined) {
  return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => api.getWorkflow(workflowId!),
    enabled: !!workflowId,
    refetchInterval: (query) => {
      // Poll every 5s while running, stop when completed/failed
      const data = query.state.data;
      return data?.status === 'running' ? 5000 : false;
    },
  });
}

export function useWorkflowSession(workflowId: string | undefined) {
  return useQuery({
    queryKey: ['workflow', workflowId, 'session'],
    queryFn: () => api.getWorkflowSession(workflowId!),
    enabled: !!workflowId,
  });
}

export function useDeliverables(workflowId: string | undefined) {
  return useQuery({
    queryKey: ['workflow', workflowId, 'deliverables'],
    queryFn: () => api.listDeliverables(workflowId!),
    enabled: !!workflowId,
  });
}

export function useDeliverable(workflowId: string | undefined, filePath: string | undefined) {
  return useQuery({
    queryKey: ['workflow', workflowId, 'deliverable', filePath],
    queryFn: () => api.getDeliverable(workflowId!, filePath!),
    enabled: !!workflowId && !!filePath,
  });
}

export function useStartWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StartWorkflowInput) => api.startWorkflow(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useCancelWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => api.cancelWorkflow(workflowId),
    onSuccess: (_data, workflowId) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

// Config hooks
export function useConfigs() {
  return useQuery({
    queryKey: ['configs'],
    queryFn: () => api.listConfigs(),
  });
}

export function useConfig(name: string | undefined) {
  return useQuery({
    queryKey: ['config', name],
    queryFn: () => api.getConfig(name!),
    enabled: !!name,
  });
}

export function useSaveConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, content }: { name: string; content: string }) =>
      api.saveConfig(name, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });
}

export function useDeleteConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.deleteConfig(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });
}

// Worker hooks
export function useWorkerStatus() {
  return useQuery({
    queryKey: ['worker', 'status'],
    queryFn: () => api.getWorkerStatus(),
    refetchInterval: 5000, // Poll every 5s
  });
}

export function useStartWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.startWorker(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'status'] });
    },
  });
}

export function useStopWorker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.stopWorker(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker', 'status'] });
    },
  });
}

// Settings hooks
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });
}

export function useUpdateApiKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keys: ApiKeysInput) => api.updateApiKeys(keys),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useUpdateRouterDefault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (routerDefault: string | null) => api.updateRouterDefault(routerDefault),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useTestApiKey() {
  return useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      api.testApiKey(provider, apiKey),
  });
}
