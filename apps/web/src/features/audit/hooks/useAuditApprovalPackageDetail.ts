import { useQuery } from "@tanstack/react-query";
import { auditApprovalPackageService } from "../services/audit-approval-package.service";
export function useAuditApprovalPackageDetail(approvalId: string) {
  return useQuery({ queryKey: ["audit", "review-approval", "package", approvalId], queryFn: () => auditApprovalPackageService.detail(approvalId), enabled: Boolean(approvalId) });
}
