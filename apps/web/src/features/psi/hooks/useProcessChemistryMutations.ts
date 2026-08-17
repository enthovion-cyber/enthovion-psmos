import { useMutation, useQueryClient } from '@tanstack/react-query';
import { processChemistryService } from '../services/process-chemistry.service';

export function useProcessChemistryMutations(chemistryId?: string | undefined, unitId?: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['psi', 'process-chemistry'] });
    void queryClient.invalidateQueries({ queryKey: ['psi', 'process-chemistry-detail', chemistryId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => unitId ? processChemistryService.createForUnit(unitId, input) : processChemistryService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.update(chemistryId as string, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.archive(chemistryId as string, input), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.reactivate(chemistryId as string, input), onSuccess: invalidate }),
    addRole: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.addRole(chemistryId as string, input), onSuccess: invalidate }),
    updateConditions: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.updateConditions(chemistryId as string, input), onSuccess: invalidate }),
    updateHazards: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.updateHazards(chemistryId as string, input), onSuccess: invalidate }),
    saveScenario: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.saveScenario(chemistryId as string, input), onSuccess: invalidate }),
    saveControl: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.saveControl(chemistryId as string, input), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => processChemistryService.runCompleteness(chemistryId as string), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.submitReview(chemistryId as string, input), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => processChemistryService.linkDocument(chemistryId as string, input), onSuccess: invalidate })
  };
}
