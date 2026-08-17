import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingApprovalRuleService } from '../services/training-approval-rule.service';

export function useTrainingApprovalRules(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'review', 'rules', params], queryFn: () => trainingApprovalRuleService.list(params) });
}
export function useTrainingApprovalRule(ruleId?: string) {
  return useQuery({ queryKey: ['training', 'review', 'rule', ruleId], queryFn: () => trainingApprovalRuleService.detail(ruleId as string), enabled: Boolean(ruleId) });
}
export function useTrainingApprovalRuleMutations(ruleId?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'review', 'rules'] });
  return {
    create: useMutation({ mutationFn: trainingApprovalRuleService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (data: Record<string, any>) => trainingApprovalRuleService.update(ruleId as string, data), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (reason: string) => trainingApprovalRuleService.archive(ruleId as string, reason), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: () => trainingApprovalRuleService.activate(ruleId as string), onSuccess: invalidate })
  };
}
