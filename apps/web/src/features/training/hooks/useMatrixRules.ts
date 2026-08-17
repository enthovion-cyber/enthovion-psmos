import { useQuery } from '@tanstack/react-query';
import { trainingMatrixRuleService } from '../services/training-matrix-rule.service';

export function useMatrixRules(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-matrix-rules', params], queryFn: () => trainingMatrixRuleService.list(params) });
}

export function useMatrixRule(ruleId: string) {
  return useQuery({ queryKey: ['training-matrix-rule', ruleId], queryFn: () => trainingMatrixRuleService.detail(ruleId), enabled: Boolean(ruleId) });
}
