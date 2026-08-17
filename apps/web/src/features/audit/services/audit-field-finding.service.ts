import { get, patch, post } from "./audit-api";
import type { AuditExecutionDetail } from "../types/audit-execution.types";

export const auditFieldFindingService = {
  register: (params?: Record<string, unknown>) => get<Record<string, any>>("/audit-compliance/field-findings", params),
  add: (executionId: string, payload: Record<string, unknown>) => post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/field-findings`, payload),
  update: (executionId: string, findingId: string, payload: Record<string, unknown>) => patch<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/field-findings/${findingId}`, payload),
  cancel: (executionId: string, findingId: string, reason: string) => post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/field-findings/${findingId}/cancel`, { reason }),
  convert: (executionId: string, findingId: string, payload: Record<string, unknown>) => post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/field-findings/${findingId}/convert-foundation`, payload),
};
