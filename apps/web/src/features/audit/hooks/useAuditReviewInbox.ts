import { useQuery } from "@tanstack/react-query";
import { auditReviewService } from "../services/audit-review.service";
export function useAuditReviewInbox(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "review-approval", "inbox", filters], queryFn: () => auditReviewService.inbox(filters) });
}
