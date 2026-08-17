import { useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentDesignService } from '../services/equipment-design.service';

export function useEquipmentDesignMutations(designBasisId?: string | undefined, unitId?: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['psi', 'equipment-design'] });
    void queryClient.invalidateQueries({ queryKey: ['psi', 'equipment-design-detail', designBasisId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => unitId ? equipmentDesignService.createForUnit(unitId, input) : equipmentDesignService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => equipmentDesignService.update(String(designBasisId), input), onSuccess: invalidate }),
    updateSection: useMutation({ mutationFn: ({ section, input }: { section: string; input: Record<string, unknown> }) => equipmentDesignService.updateSection(String(designBasisId), section, input), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => equipmentDesignService.runCompleteness(String(designBasisId)), onSuccess: invalidate }),
    runConflictCheck: useMutation({ mutationFn: () => equipmentDesignService.runConflictCheck(String(designBasisId)), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown>) => equipmentDesignService.submitReview(String(designBasisId), input), onSuccess: invalidate }),
    compareMi: useMutation({ mutationFn: () => equipmentDesignService.compareOnly(String(designBasisId)), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => equipmentDesignService.linkDocument(String(designBasisId), input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => equipmentDesignService.archive(String(designBasisId), input), onSuccess: invalidate })
  };
}
