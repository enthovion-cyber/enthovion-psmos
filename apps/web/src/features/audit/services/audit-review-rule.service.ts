import { get, patch, post } from "./audit-api";
import type { AuditReviewRule } from "../types/audit-review.types";

export const auditReviewRuleService = {
  list: (params?: Record<string, unknown>) => get<{ rows: AuditReviewRule[]; total: number }>("/audit-compliance/review-approval/rules", params),
  detail: (ruleId: string) => get<{ rule: AuditReviewRule; stages: Record<string, unknown>[] }>(`/audit-compliance/review-approval/rules/${ruleId}`),
  create: (data: Record<string, unknown>) => post<{ rule: AuditReviewRule; stages: Record<string, unknown>[] }>("/audit-compliance/review-approval/rules", data),
  update: (ruleId: string, data: Record<string, unknown>) => patch<{ rule: AuditReviewRule; stages: Record<string, unknown>[] }>(`/audit-compliance/review-approval/rules/${ruleId}`, data),
  transition: (ruleId: string, action: "activate" | "archive", data?: Record<string, unknown>) => post(`/audit-compliance/review-approval/rules/${ruleId}/${action}`, data),
};
