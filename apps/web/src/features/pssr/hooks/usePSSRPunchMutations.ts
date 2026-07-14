import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrPunchListService } from '../services/pssr-punch-list.service';

export function usePSSRPunchMutations(pssrId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'punch-list'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'history'] });
  };
  return {
    sync: useMutation({ mutationFn: () => pssrPunchListService.sync(pssrId), onSuccess: invalidate }),
    addItem: useMutation({ mutationFn: (values: Record<string, any>) => pssrPunchListService.addItem(pssrId, values), onSuccess: invalidate }),
    requestVerification: useMutation({ mutationFn: (punchItemId: string) => pssrPunchListService.requestVerification(pssrId, punchItemId), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (punchItemId: string) => pssrPunchListService.verify(pssrId, punchItemId), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (punchItemId: string) => pssrPunchListService.close(pssrId, punchItemId), onSuccess: invalidate }),
    reopen: useMutation({ mutationFn: (punchItemId: string) => pssrPunchListService.reopen(pssrId, punchItemId), onSuccess: invalidate }),
    defer: useMutation({ mutationFn: ({ punchItemId, values }: { punchItemId: string; values: Record<string, any> }) => pssrPunchListService.defer(pssrId, punchItemId, values), onSuccess: invalidate }),
    refreshActionStatuses: useMutation({ mutationFn: () => pssrPunchListService.refreshActionStatuses(pssrId), onSuccess: invalidate })
  };
}
