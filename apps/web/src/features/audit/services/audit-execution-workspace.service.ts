import { get } from "./audit-api";
import type { AuditExecutionDetail } from "../types/audit-execution.types";

export const auditExecutionWorkspaceService = {
  workspace: (id: string) => get<AuditExecutionDetail>(`/audit-compliance/execution/${id}/workspace`),
  checklist: (id: string) => get<AuditExecutionDetail>(`/audit-compliance/execution/${id}/checklist`),
  sections: (id: string) => get<Record<string, any>[]>(`/audit-compliance/execution/${id}/checklist/sections`),
  item: (id: string, itemId: string) => get<Record<string, any>>(`/audit-compliance/execution/${id}/checklist/items/${itemId}`),
};
