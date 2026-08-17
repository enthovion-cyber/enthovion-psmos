import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditReviewRuleService } from "../services/audit-review-rule.service";
export function useAuditReviewRules(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "review-approval", "rules", filters], queryFn: () => auditReviewRuleService.list(filters) });
}
export function useAuditReviewRule(ruleId: string) {
  return useQuery({ queryKey: ["audit", "review-approval", "rule", ruleId], queryFn: () => auditReviewRuleService.detail(ruleId), enabled: Boolean(ruleId) });
}
export function useAuditReviewRuleMutations(ruleId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["audit", "review-approval", "rules"] });
  return {
    create: useMutation({ mutationFn: auditReviewRuleService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (data: Record<string, unknown>) => auditReviewRuleService.update(String(ruleId), data), onSuccess: invalidate }),
    transition: useMutation({ mutationFn: ({ action, data }: { action: "activate" | "archive"; data?: Record<string, unknown> }) => auditReviewRuleService.transition(String(ruleId), action, data), onSuccess: invalidate }),
  };
}
