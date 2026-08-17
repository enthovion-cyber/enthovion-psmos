import { useMutation, useQueryClient } from '@tanstack/react-query';
import { safeOperatingLimitService } from '../services/safe-operating-limit.service';

export function useSafeOperatingLimitMutations(limitId?: string | undefined, unitId?: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['psi', 'safe-operating-limits'] });
    void queryClient.invalidateQueries({ queryKey: ['psi', 'safe-operating-limit-detail', limitId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => unitId ? safeOperatingLimitService.createForUnit(unitId, input) : safeOperatingLimitService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.update(limitId as string, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.archive(limitId as string, input), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.reactivate(limitId as string, input), onSuccess: invalidate }),
    clone: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.clone(limitId as string, input), onSuccess: invalidate }),
    updateValues: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.updateValues(limitId as string, input), onSuccess: invalidate }),
    saveConsequence: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.saveConsequence(limitId as string, input), onSuccess: invalidate }),
    saveOperatorResponse: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.saveOperatorResponse(limitId as string, input), onSuccess: invalidate }),
    saveControl: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.saveControl(limitId as string, input), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => safeOperatingLimitService.runCompleteness(limitId as string), onSuccess: invalidate }),
    runConflictCheck: useMutation({ mutationFn: () => safeOperatingLimitService.runConflictCheck(limitId as string), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.submitReview(limitId as string, input), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => safeOperatingLimitService.linkDocument(limitId as string, input), onSuccess: invalidate })
  };
}
