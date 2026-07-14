import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrChecklistService } from '../services/pssr-checklist.service';

export function usePSSRChecklistMutations(pssrId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId] });
  };
  return {
    generate: useMutation({ mutationFn: () => pssrChecklistService.generate(pssrId), onSuccess: invalidate }),
    regenerate: useMutation({ mutationFn: () => pssrChecklistService.regenerate(pssrId), onSuccess: invalidate }),
    addItem: useMutation({ mutationFn: (values: Record<string, any>) => pssrChecklistService.addItem(pssrId, values), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: (itemId: string) => pssrChecklistService.complete(pssrId, itemId), onSuccess: invalidate }),
    notApplicable: useMutation({ mutationFn: (itemId: string) => pssrChecklistService.notApplicable(pssrId, itemId), onSuccess: invalidate }),
    fail: useMutation({ mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) => pssrChecklistService.fail(pssrId, itemId, reason), onSuccess: invalidate }),
    waive: useMutation({ mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) => pssrChecklistService.waive(pssrId, itemId, reason), onSuccess: invalidate }),
    evidence: useMutation({ mutationFn: ({ itemId, values }: { itemId: string; values: Record<string, any> }) => pssrChecklistService.evidence(pssrId, itemId, values), onSuccess: invalidate }),
    requestVerification: useMutation({ mutationFn: (itemId: string) => pssrChecklistService.requestVerification(pssrId, itemId), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: ({ itemId, comment }: { itemId: string; comment: string }) => pssrChecklistService.verify(pssrId, itemId, comment), onSuccess: invalidate }),
    rejectVerification: useMutation({ mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) => pssrChecklistService.rejectVerification(pssrId, itemId, reason), onSuccess: invalidate })
  };
}
