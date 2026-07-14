'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workflowsService, type StartWorkflowInput, type WorkflowTemplateInput } from '@/services/workflows.service';

export function useWorkflowTemplates(module?: string) {
  return useQuery({ queryKey: ['workflows', 'templates', module], queryFn: () => workflowsService.listTemplates(module) });
}

export function useWorkflowTemplate(id?: string) {
  return useQuery({ queryKey: ['workflows', 'templates', id], queryFn: () => workflowsService.getTemplate(id!), enabled: Boolean(id) });
}

export function useWorkflowInstance(id: string) {
  return useQuery({ queryKey: ['workflows', 'instances', id], queryFn: () => workflowsService.getInstance(id), enabled: Boolean(id) });
}

export function useWorkflowOverdue() {
  return useQuery({ queryKey: ['workflows', 'overdue'], queryFn: () => workflowsService.overdue() });
}

export function useWorkflowMutations(instanceId?: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workflows'] }),
      instanceId ? queryClient.invalidateQueries({ queryKey: ['workflows', 'instances', instanceId] }) : Promise.resolve()
    ]);
  };
  return {
    createTemplate: useMutation({ mutationFn: (input: WorkflowTemplateInput) => workflowsService.createTemplate(input), onSuccess: invalidate }),
    updateTemplate: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<WorkflowTemplateInput> }) => workflowsService.updateTemplate(id, input), onSuccess: invalidate }),
    deleteTemplate: useMutation({ mutationFn: (id: string) => workflowsService.deleteTemplate(id), onSuccess: invalidate }),
    cloneTemplate: useMutation({ mutationFn: (id: string) => workflowsService.cloneTemplate(id), onSuccess: invalidate }),
    activateTemplate: useMutation({ mutationFn: (id: string) => workflowsService.activateTemplate(id), onSuccess: invalidate }),
    deactivateTemplate: useMutation({ mutationFn: (id: string) => workflowsService.deactivateTemplate(id), onSuccess: invalidate }),
    setDefault: useMutation({ mutationFn: (id: string) => workflowsService.setDefault(id), onSuccess: invalidate }),
    start: useMutation({ mutationFn: (input: StartWorkflowInput) => workflowsService.start(input), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (input: { stepId?: string; comment?: string }) => workflowsService.approve(instanceId!, input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (input: { stepId?: string; comment: string }) => workflowsService.reject(instanceId!, input), onSuccess: invalidate }),
    returnForRevision: useMutation({ mutationFn: (input: { stepId?: string; comment: string }) => workflowsService.returnForRevision(instanceId!, input), onSuccess: invalidate }),
    override: useMutation({ mutationFn: (reason: string) => workflowsService.override(instanceId!, reason), onSuccess: invalidate }),
    escalate: useMutation({ mutationFn: () => workflowsService.escalate(instanceId!), onSuccess: invalidate })
  };
}
