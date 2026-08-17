import { useQuery } from "@tanstack/react-query";
import { auditReviewService } from "../services/audit-review.service";
export function useAuditApprovalLookups() {
  return useQuery({ queryKey: ["audit", "review-approval", "context"], queryFn: () => auditReviewService.context() });
}
