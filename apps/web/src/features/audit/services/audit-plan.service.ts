import { get, patch, post, remove } from "./audit-api";
import type {
  AuditPlanDashboard,
  AuditPlanDetail,
  AuditPlanLookups,
  AuditPlanRegister,
} from "../types/audit-plan.types";

export const auditPlanService = {
  dashboard: (params?: Record<string, unknown>) =>
    get<AuditPlanDashboard>("/audit-compliance/plans/dashboard", params),
  register: (params?: Record<string, unknown>) =>
    get<AuditPlanRegister>("/audit-compliance/plans", params),
  calendar: (params?: Record<string, unknown>) =>
    get<Record<string, any>>("/audit-compliance/plans/calendar", params),
  context: () => get<Record<string, any>>("/audit-compliance/plans/context"),
  lookups: () => get<AuditPlanLookups>("/audit-compliance/plans/lookups"),
  settings: (siteId?: string) =>
    get<Record<string, any>>(
      "/audit-compliance/plans/settings",
      siteId ? { siteId } : undefined,
    ),
  updateSettings: (payload: Record<string, unknown>) =>
    patch<Record<string, any>>("/audit-compliance/plans/settings", payload),
  detail: (id: string) => get<AuditPlanDetail>(`/audit-compliance/plans/${id}`),
  create: (payload: Record<string, unknown>) =>
    post<AuditPlanDetail>("/audit-compliance/plans", payload),
  update: (id: string, payload: Record<string, unknown>) =>
    patch<AuditPlanDetail>(`/audit-compliance/plans/${id}`, payload),
  action: (id: string, action: string, payload: Record<string, unknown> = {}) =>
    post<AuditPlanDetail>(`/audit-compliance/plans/${id}/${action}`, payload),
  section: (id: string, section: string) =>
    get<Record<string, any>[]>(`/audit-compliance/plans/${id}/${section}`),
  addSection: (id: string, section: string, payload: Record<string, unknown>) =>
    post(`/audit-compliance/plans/${id}/${section}`, payload),
  updateSection: (
    id: string,
    section: string,
    rowId: string,
    payload: Record<string, unknown>,
  ) => patch(`/audit-compliance/plans/${id}/${section}/${rowId}`, payload),
  removeSection: (id: string, section: string, rowId: string, reason: string) =>
    remove(`/audit-compliance/plans/${id}/${section}/${rowId}`, { reason }),
  readiness: (id: string, run = false) =>
    run
      ? post<Record<string, any>>(`/audit-compliance/plans/${id}/readiness/run`)
      : get<Record<string, any>>(`/audit-compliance/plans/${id}/readiness`),
  conflicts: (id: string, detect = false) =>
    detect
      ? post<Record<string, any>[]>(
          `/audit-compliance/plans/${id}/conflicts/detect`,
        )
      : get<Record<string, any>[]>(`/audit-compliance/plans/${id}/conflicts`),
  generate: (payload: Record<string, unknown>) =>
    post<Record<string, any>>(
      "/audit-compliance/plans/generate-from-program",
      payload,
    ),
};
