import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditApprovalPackageService } from "../services/audit-approval-package.service";
export function useAuditApprovalMutations(approvalId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["audit", "review-approval"] });
  return {
    create: useMutation({ mutationFn: auditApprovalPackageService.create, onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (data?: Record<string, unknown>) => auditApprovalPackageService.submit(String(approvalId), data), onSuccess: invalidate }),
    transition: useMutation({ mutationFn: ({ action, data }: { action: string; data?: Record<string, unknown> }) => auditApprovalPackageService.transition(String(approvalId), action, data), onSuccess: invalidate }),
    addCondition: useMutation({ mutationFn: (data: Record<string, unknown>) => auditApprovalPackageService.addCondition(String(approvalId), data), onSuccess: invalidate }),
  };
}
