import { get, patch, post, remove } from "./audit-api";
import type { AuditExecutionDetail, AuditExecutionEvidence } from "../types/audit-execution.types";

export const auditExecutionEvidenceService = {
  list: (executionId: string) => get<AuditExecutionEvidence[]>(`/audit-compliance/execution/${executionId}/evidence`),
  add: (executionId: string, payload: Record<string, unknown>) => post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/evidence`, payload),
  update: (executionId: string, evidenceId: string, payload: Record<string, unknown>) => patch<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/evidence/${evidenceId}`, payload),
  remove: (executionId: string, evidenceId: string, reason: string) => remove<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/evidence/${evidenceId}`, { reason }),
};
