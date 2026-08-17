import { get } from "./audit-api";
import type { AuditApprovalDashboard, AuditApprovalList } from "../types/audit-review.types";

export const auditReviewService = {
  dashboard: (params?: Record<string, unknown>) => get<AuditApprovalDashboard>("/audit-compliance/review-approval/dashboard", params),
  dashboardSummary: (params?: Record<string, unknown>) => get<AuditApprovalDashboard["summary"]>("/audit-compliance/review-approval/dashboard/summary", params),
  inbox: (params?: Record<string, unknown>) => get<AuditApprovalList>("/audit-compliance/review-approval/inbox", params),
  submissions: (params?: Record<string, unknown>) => get<AuditApprovalList>("/audit-compliance/review-approval/my-submissions", params),
  view: (view: string, params?: Record<string, unknown>) => get<AuditApprovalList>(`/audit-compliance/review-approval/${view}`, params),
  context: () => get<Record<string, unknown>>("/audit-compliance/review-approval/context"),
};
