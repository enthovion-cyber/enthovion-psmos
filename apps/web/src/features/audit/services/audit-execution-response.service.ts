import { patch, post } from "./audit-api";
import type { AuditExecutionDetail } from "../types/audit-execution.types";

export const auditExecutionResponseService = {
  save: (executionId: string, itemId: string, payload: Record<string, unknown>) =>
    post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/checklist/items/${itemId}/response`, payload),
  update: (executionId: string, responseId: string, payload: Record<string, unknown>) =>
    patch<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/responses/${responseId}`, payload),
  reopen: (executionId: string, responseId: string, payload: Record<string, unknown>) =>
    post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/responses/${responseId}/reopen`, payload),
  completeSection: (executionId: string, sectionId: string, payload: Record<string, unknown> = {}) =>
    post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/checklist/sections/${sectionId}/complete`, payload),
};
