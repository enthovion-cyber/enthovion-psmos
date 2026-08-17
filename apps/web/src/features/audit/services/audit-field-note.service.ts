import { patch, post, remove } from "./audit-api";
import type { AuditExecutionDetail } from "../types/audit-execution.types";

export const auditFieldNoteService = {
  add: (executionId: string, payload: Record<string, unknown>) => post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/field-notes`, payload),
  update: (executionId: string, noteId: string, payload: Record<string, unknown>) => patch<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/field-notes/${noteId}`, payload),
  remove: (executionId: string, noteId: string, reason: string) => remove<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/field-notes/${noteId}`, { reason }),
  convert: (executionId: string, noteId: string, payload: Record<string, unknown>) => post<AuditExecutionDetail>(`/audit-compliance/execution/${executionId}/field-notes/${noteId}/convert-to-finding`, payload),
};
