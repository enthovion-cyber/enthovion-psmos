import { useMutation, useQueryClient } from '@tanstack/react-query';
import { electricalClassificationService } from '../services/electrical-classification.service';

export function useElectricalClassificationMutations(classificationId?: string, unitId?: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['psi', 'electrical-classifications'] });
    if (classificationId) await queryClient.invalidateQueries({ queryKey: ['psi', 'electrical-classification', classificationId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => unitId ? electricalClassificationService.createForUnit(unitId, input) : electricalClassificationService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.update(String(classificationId), input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.archive(String(classificationId), input), onSuccess: invalidate }),
    updateHazardSources: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.updateHazardSources(String(classificationId), input), onSuccess: invalidate }),
    updateAreaDetails: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.updateAreaDetails(String(classificationId), input), onSuccess: invalidate }),
    updateVentilationBasis: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.updateVentilationBasis(String(classificationId), input), onSuccess: invalidate }),
    updateProtectionRequirements: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.updateProtectionRequirements(String(classificationId), input), onSuccess: invalidate }),
    addInstalledEquipment: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.addInstalledEquipment(String(classificationId), input), onSuccess: invalidate }),
    runRatingCheck: useMutation({ mutationFn: () => electricalClassificationService.runRatingCheck(String(classificationId)), onSuccess: invalidate }),
    updatePtwControls: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.updatePtwControls(String(classificationId), input), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.linkDocument(String(classificationId), input), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => electricalClassificationService.runCompleteness(String(classificationId)), onSuccess: invalidate }),
    runConflictCheck: useMutation({ mutationFn: () => electricalClassificationService.runConflictCheck(String(classificationId)), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown>) => electricalClassificationService.submitReview(String(classificationId), input), onSuccess: invalidate })
  };
}
