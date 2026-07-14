import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lopaDetailService } from '../services/lopa-detail.service';
import type { LopaDetailUpdate } from '../types/lopa-detail.types';

export function useLopaStudyMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['lopa'] });
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'detail', id] });
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'readiness', id] });
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'recent-activity', id] });
  };
  return {
    update: useMutation({ mutationFn: (values: LopaDetailUpdate) => lopaDetailService.update(id, values), onSuccess: refresh }),
    cancel: useMutation({ mutationFn: (reason: string) => lopaDetailService.cancel(id, reason), onSuccess: refresh }),
    reopen: useMutation({ mutationFn: (reason: string) => lopaDetailService.reopen(id, reason), onSuccess: refresh }),
    syncHazop: useMutation({ mutationFn: () => lopaDetailService.syncHazopSource(id), onSuccess: refresh })
  };
}
