import { useMutation, useQueryClient } from '@tanstack/react-query';
import { safeguardService } from '../services/safeguard.service';

export function useSafeguardMutations(safeguardId?: string, unitId?: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['psi', 'safeguards'] });
    if (safeguardId) await queryClient.invalidateQueries({ queryKey: ['psi', 'safeguard-detail', safeguardId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => unitId ? safeguardService.createForUnit(unitId, input) : safeguardService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.update(String(safeguardId), input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.archive(String(safeguardId), input), onSuccess: invalidate }),
    addHazard: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.addHazard(String(safeguardId), input), onSuccess: invalidate }),
    updateFunctionRequirements: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.updateFunctionRequirements(String(safeguardId), input), onSuccess: invalidate }),
    addSourceLink: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.addSourceLink(String(safeguardId), input), onSuccess: invalidate }),
    updateEffectiveness: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.updateEffectiveness(String(safeguardId), input), onSuccess: invalidate }),
    updateTestingStatus: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.updateTestingStatus(String(safeguardId), input), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.linkDocument(String(safeguardId), input), onSuccess: invalidate }),
    runSourceStatusCheck: useMutation({ mutationFn: () => safeguardService.runSourceStatusCheck(String(safeguardId)), onSuccess: invalidate }),
    compareSource: useMutation({ mutationFn: () => safeguardService.compareSource(String(safeguardId)), onSuccess: invalidate }),
    pullSource: useMutation({ mutationFn: () => safeguardService.pullSource(String(safeguardId)), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => safeguardService.runCompleteness(String(safeguardId)), onSuccess: invalidate }),
    runConflictCheck: useMutation({ mutationFn: () => safeguardService.runConflictCheck(String(safeguardId)), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardService.submitReview(String(safeguardId), input), onSuccess: invalidate })
  };
}
