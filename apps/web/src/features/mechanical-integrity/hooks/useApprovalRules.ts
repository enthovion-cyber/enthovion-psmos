import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalRuleService } from '../services/approval-rule.service';

export function useApprovalRules(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'approval-rules', params], queryFn: () => approvalRuleService.list(params) });
}

export function useApprovalRuleMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'approval-rules'] });
  return {
    create: useMutation({ mutationFn: approvalRuleService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ ruleId, input }: { ruleId: string; input: Record<string, unknown> }) => approvalRuleService.update(ruleId, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: approvalRuleService.archive, onSuccess: invalidate })
  };
}
