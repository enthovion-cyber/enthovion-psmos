import { useQuery } from "@tanstack/react-query";
import { auditReviewService } from "../services/audit-review.service";
export function useAuditReviewDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "review-approval", "dashboard", filters], queryFn: () => auditReviewService.dashboard(filters) });
}
