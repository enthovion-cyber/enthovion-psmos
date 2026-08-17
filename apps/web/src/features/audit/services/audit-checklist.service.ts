import { get, patch, post, remove } from "./audit-api";
import type {
  ChecklistContext,
  ChecklistDashboard,
  ChecklistDetail,
  ChecklistRegister,
} from "../types/audit-checklist.types";
const root = "/audit-compliance/checklists";
export const auditChecklistService = {
  dashboard: (params?: Record<string, unknown>) =>
    get<ChecklistDashboard>(`${root}/dashboard`, params),
  templates: (params?: Record<string, unknown>) =>
    get<ChecklistRegister>(`${root}/templates`, params),
  context: () => get<ChecklistContext>(`${root}/context`),
  detail: (id: string) => get<ChecklistDetail>(`${root}/templates/${id}`),
  create: (payload: Record<string, unknown>) =>
    post<ChecklistDetail>(`${root}/templates`, payload),
  update: (id: string, payload: Record<string, unknown>) =>
    patch<ChecklistDetail>(`${root}/templates/${id}`, payload),
  action: (id: string, action: string, payload: Record<string, unknown> = {}) =>
    post<ChecklistDetail>(`${root}/templates/${id}/${action}`, payload),
  children: (id: string, kind: string) =>
    get<Record<string, any>[]>(`${root}/templates/${id}/${kind}`),
  addChild: (id: string, kind: string, payload: Record<string, unknown>) =>
    post(`${root}/templates/${id}/${kind}`, payload),
  updateChild: (
    id: string,
    kind: string,
    rowId: string,
    payload: Record<string, unknown>,
  ) => patch(`${root}/templates/${id}/${kind}/${rowId}`, payload),
  removeChild: (id: string, kind: string, rowId: string, reason: string) =>
    remove(`${root}/templates/${id}/${kind}/${rowId}`, { reason }),
  reorder: (id: string, kind: string, ids: string[]) =>
    post(`${root}/templates/${id}/${kind}/reorder`, { ids }),
  questionBank: (params?: Record<string, unknown>) =>
    get<Record<string, any>>(`${root}/question-bank`, params),
  question: (id: string) =>
    get<Record<string, any>>(`${root}/question-bank/${id}`),
  saveQuestion: (payload: Record<string, unknown>, id?: string) =>
    id
      ? patch<Record<string, any>>(`${root}/question-bank/${id}`, payload)
      : post<Record<string, any>>(`${root}/question-bank`, payload),
  addFromBank: (id: string, payload: Record<string, unknown>) =>
    post(`${root}/templates/${id}/items/add-from-question-bank`, payload),
  assign: (planId: string, payload: Record<string, unknown>) =>
    post(`/audit-compliance/plans/${planId}/assign-checklist`, payload),
  planChecklist: (planId: string) =>
    get<Record<string, any>>(`/audit-compliance/plans/${planId}/checklist`),
  removeAssignment: (planId: string, assignmentId: string, reason: string) =>
    remove(`/audit-compliance/plans/${planId}/checklist/${assignmentId}`, {
      reason,
    }),
  readiness: (id: string) =>
    post<Record<string, any>>(`${root}/templates/${id}/calculate-readiness`),
};
