import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regulatoryItemService } from '../services/regulatory-item.service';
import { regulatoryLinkService } from '../services/regulatory-link.service';

export function useRegulatoryItemMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['regulatory'] });
  };
  return {
    create: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.create(data), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.update(String(id), data), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.archive(String(id), data), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.reactivate(String(id), data), onSuccess: invalidate }),
    lock: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.lock(String(id), data), onSuccess: invalidate }),
    unlock: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.unlock(String(id), data), onSuccess: invalidate }),
    assignOwner: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.assignOwner(String(id), data), onSuccess: invalidate }),
    changeStatus: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.changeStatus(String(id), data), onSuccess: invalidate }),
    changeApplicability: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.changeApplicability(String(id), data), onSuccess: invalidate }),
    changeComplianceStatus: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryItemService.changeComplianceStatus(String(id), data), onSuccess: invalidate }),
    link: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryLinkService.create(String(id), data), onSuccess: invalidate })
  };
}
