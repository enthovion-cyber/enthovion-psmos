'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actionsService, type CreateActionInput } from '@/services/actions.service';

export function useActions(params?: Record<string, string>) {
  return useQuery({ queryKey: ['actions', params], queryFn: () => actionsService.list(params) });
}

export function useAction(id: string) {
  return useQuery({ queryKey: ['actions', id], queryFn: () => actionsService.get(id), enabled: Boolean(id) });
}

export function useActionDashboard() {
  return useQuery({ queryKey: ['actions', 'dashboard'], queryFn: () => actionsService.dashboard() });
}

export function useActionAging() {
  return useQuery({ queryKey: ['actions', 'aging'], queryFn: () => actionsService.aging() });
}

export function useActionMutations(actionId?: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['actions'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment'] }),
      actionId ? queryClient.invalidateQueries({ queryKey: ['actions', actionId] }) : Promise.resolve()
    ]);
  };
  return {
    create: useMutation({ mutationFn: (input: CreateActionInput) => actionsService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Partial<CreateActionInput>) => actionsService.update(actionId!, input), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (notes?: string) => actionsService.close(actionId!, notes), onSuccess: invalidate }),
    comment: useMutation({ mutationFn: (body: string) => actionsService.addComment(actionId!, body), onSuccess: invalidate }),
    evidence: useMutation({ mutationFn: (input: { fileName: string; mimeType: string; sizeBytes: number; storageKey: string; description?: string }) => actionsService.addEvidence(actionId!, input), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (input: { decision: 'APPROVED' | 'REJECTED'; notes?: string }) => actionsService.verify(actionId!, input), onSuccess: invalidate }),
    watch: useMutation({ mutationFn: () => actionsService.watch(actionId!), onSuccess: invalidate })
  };
}
