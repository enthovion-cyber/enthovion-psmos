import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingMatrixRuleService } from '../services/training-matrix-rule.service';

export function useMatrixRuleMutations(ruleId?: string) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['training-matrix-rules'] });
  return {
    create: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixRuleService.create(data), onSuccess: done }),
    update: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixRuleService.update(ruleId ?? '', data), onSuccess: done }),
    activate: useMutation({ mutationFn: () => trainingMatrixRuleService.activate(ruleId ?? ''), onSuccess: done }),
    deactivate: useMutation({ mutationFn: () => trainingMatrixRuleService.deactivate(ruleId ?? ''), onSuccess: done }),
    archive: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixRuleService.archive(ruleId ?? '', data), onSuccess: done })
  };
}
