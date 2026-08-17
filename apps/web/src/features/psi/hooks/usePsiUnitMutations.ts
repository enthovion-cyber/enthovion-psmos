import { useMutation, useQueryClient } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';
import { psiLinkedRecordService } from '../services/psi-linked-record.service';
import { psiUnitService } from '../services/psi-unit.service';

export function usePsiUnitMutations(unitId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['psi'] });
    if (unitId) void queryClient.invalidateQueries({ queryKey: ['psi', 'units', unitId] });
  };
  return {
    create: useMutation({ mutationFn: psiUnitService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => psiUnitService.update(unitId as string, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => psiUnitService.archive(unitId as string, input), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => psiCompletenessService.run(unitId as string), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => psiUnitService.submitReview(unitId as string, input), onSuccess: invalidate }),
    linkEquipment: useMutation({ mutationFn: (input: Record<string, unknown>) => psiLinkedRecordService.linkEquipment(unitId as string, input), onSuccess: invalidate }),
    linkRecord: useMutation({ mutationFn: (input: Record<string, unknown>) => psiLinkedRecordService.linkRecord(unitId as string, input), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => psiLinkedRecordService.linkDocument(unitId as string, input), onSuccess: invalidate })
  };
}
