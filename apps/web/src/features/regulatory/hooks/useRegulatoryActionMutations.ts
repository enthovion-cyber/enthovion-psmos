import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regulatoryActionService } from '../services/regulatory-action.service';

export function useRegulatoryActionMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['regulatory', 'actions'] });
  return {
    create: useMutation({ mutationFn: regulatoryActionService.create, onSuccess: invalidate }),
    linkExisting: useMutation({ mutationFn: regulatoryActionService.linkExisting, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ actionLinkId, data }: { actionLinkId: string; data: Record<string, unknown> }) => regulatoryActionService.update(actionLinkId, data), onSuccess: invalidate }),
    sync: useMutation({ mutationFn: ({ actionLinkId, data }: { actionLinkId: string; data?: Record<string, unknown> }) => regulatoryActionService.sync(actionLinkId, data), onSuccess: invalidate }),
    refreshSnapshot: useMutation({ mutationFn: regulatoryActionService.refreshSnapshot, onSuccess: invalidate }),
    checkReadiness: useMutation({ mutationFn: regulatoryActionService.checkReadiness, onSuccess: invalidate }),
    verify: useMutation({ mutationFn: ({ actionLinkId, data }: { actionLinkId: string; data: Record<string, unknown> }) => regulatoryActionService.verify(actionLinkId, data), onSuccess: invalidate }),
    failVerification: useMutation({ mutationFn: ({ actionLinkId, data }: { actionLinkId: string; data: Record<string, unknown> }) => regulatoryActionService.failVerification(actionLinkId, data), onSuccess: invalidate }),
    effectiveness: useMutation({ mutationFn: ({ actionLinkId, data }: { actionLinkId: string; data: Record<string, unknown> }) => regulatoryActionService.effectiveness(actionLinkId, data), onSuccess: invalidate }),
    escalate: useMutation({ mutationFn: ({ actionLinkId, data }: { actionLinkId: string; data: Record<string, unknown> }) => regulatoryActionService.escalate(actionLinkId, data), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ actionLinkId, reason }: { actionLinkId: string; reason: string }) => regulatoryActionService.archive(actionLinkId, reason), onSuccess: invalidate })
  };
}
