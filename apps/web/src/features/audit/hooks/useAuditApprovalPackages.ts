import { useQuery } from "@tanstack/react-query";
import { auditApprovalPackageService } from "../services/audit-approval-package.service";
import { auditReviewService } from "../services/audit-review.service";
export function useAuditApprovalPackages(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "review-approval", "packages", filters], queryFn: () => auditApprovalPackageService.list(filters) });
}
export function useAuditApprovalView(view: string, filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "review-approval", view, filters], queryFn: () => auditReviewService.view(view, filters) });
}
