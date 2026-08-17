import { get, post, patch } from "./audit-api";
import type { AuditApprovalDetail, AuditApprovalList } from "../types/audit-review.types";

export const auditApprovalPackageService = {
  list: (params?: Record<string, unknown>) => get<AuditApprovalList>("/audit-compliance/review-approval/packages", params),
  detail: (approvalId: string) => get<AuditApprovalDetail>(`/audit-compliance/review-approval/packages/${approvalId}`),
  section: <T = unknown>(approvalId: string, section: string) => get<T>(`/audit-compliance/review-approval/packages/${approvalId}/${section}`),
  create: (data: Record<string, unknown>) => post<AuditApprovalDetail>("/audit-compliance/review-approval/packages", data),
  submit: (approvalId: string, data?: Record<string, unknown>) => post<AuditApprovalDetail>(`/audit-compliance/review-approval/packages/${approvalId}/submit`, data),
  transition: (approvalId: string, action: string, data?: Record<string, unknown>) => post<AuditApprovalDetail>(`/audit-compliance/review-approval/packages/${approvalId}/${action}`, data),
  addCondition: (approvalId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/audit-compliance/review-approval/packages/${approvalId}/conditions`, data),
  updateCondition: (approvalId: string, conditionId: string, data: Record<string, unknown>) => patch<Record<string, unknown>>(`/audit-compliance/review-approval/packages/${approvalId}/conditions/${conditionId}`, data),
};
