import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialCompatibilityService } from '../services/material-compatibility.service';

export function useMaterialCompatibilityMutations(compatibilityId?: string, unitId?: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['psi', 'material-compatibility'] });
    if (compatibilityId) await queryClient.invalidateQueries({ queryKey: ['psi', 'material-compatibility-detail', compatibilityId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => unitId ? materialCompatibilityService.createForUnit(unitId, input) : materialCompatibilityService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.update(String(compatibilityId), input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.archive(String(compatibilityId), input), onSuccess: invalidate }),
    updateServiceConditions: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.updateServiceConditions(String(compatibilityId), input), onSuccess: invalidate }),
    updateMaterialDetails: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.updateMaterialDetails(String(compatibilityId), input), onSuccess: invalidate }),
    updateRating: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.updateRating(String(compatibilityId), input), onSuccess: invalidate }),
    addDegradationMechanism: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.addDegradationMechanism(String(compatibilityId), input), onSuccess: invalidate }),
    updateControls: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.updateControls(String(compatibilityId), input), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.linkDocument(String(compatibilityId), input), onSuccess: invalidate }),
    runCompatibilityCheck: useMutation({ mutationFn: () => materialCompatibilityService.runCompatibilityCheck(String(compatibilityId)), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => materialCompatibilityService.runCompleteness(String(compatibilityId)), onSuccess: invalidate }),
    runConflictCheck: useMutation({ mutationFn: () => materialCompatibilityService.runConflictCheck(String(compatibilityId)), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown>) => materialCompatibilityService.submitReview(String(compatibilityId), input), onSuccess: invalidate })
  };
}

