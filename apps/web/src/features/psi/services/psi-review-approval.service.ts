import { get, patch, post, remove } from './psi-api';
import type { PsiApprovalDashboard, PsiApprovalDetail, PsiApprovalPaged, PsiApprovalRequest, PsiApprovalRule } from '../types/psi-review-approval.types';

const base = '/process-safety-information/review-approval';

export const psiReviewApprovalService = {
  dashboard: (params?: Record<string, unknown>) => get<PsiApprovalDashboard>(`${base}/dashboard`, params),
  inbox: (params?: Record<string, unknown>) => get<PsiApprovalPaged>(`${base}/inbox`, params),
  mySubmissions: (params?: Record<string, unknown>) => get<PsiApprovalPaged>(`${base}/my-submissions`, params),
  register: (view = '', params?: Record<string, unknown>) => get<PsiApprovalPaged>(view ? `${base}/${view}` : base, params),
  detail: (approvalId: string) => get<PsiApprovalDetail>(`${base}/${approvalId}`),
  package: (approvalId: string) => get<Record<string, unknown>>(`${base}/${approvalId}/package`),
  snapshot: (approvalId: string) => get<Record<string, unknown>[]>(`${base}/${approvalId}/snapshot`),
  diff: (approvalId: string) => get<Record<string, unknown>>(`${base}/${approvalId}/diff`),
  history: (approvalId: string) => get<Record<string, unknown>[]>(`${base}/${approvalId}/history`),
  validationResults: (approvalId: string) => get<Record<string, unknown>[]>(`${base}/${approvalId}/validation-results`),
  comments: (approvalId: string) => get<Record<string, unknown>[]>(`${base}/${approvalId}/comments`),
  submitSource: (module: string, recordId: string, data?: Record<string, unknown>) => post<PsiApprovalDetail>(`/process-safety-information/${module}/${recordId}/submit-review`, data),
  sourceStatus: (module: string, recordId: string) => get<Record<string, unknown>>(`/process-safety-information/${module}/${recordId}/review-approval`),
  sourceHistory: (module: string, recordId: string) => get<Record<string, unknown>[]>(`/process-safety-information/${module}/${recordId}/approval-history`),
  withdraw: (approvalId: string, data: Record<string, unknown>) => post<PsiApprovalDetail>(`${base}/${approvalId}/withdraw`, data),
  resubmit: (approvalId: string, data?: Record<string, unknown>) => post<PsiApprovalDetail>(`${base}/${approvalId}/resubmit`, data),
  validate: (approvalId: string) => post<Record<string, unknown>[]>(`${base}/${approvalId}/validate`),
  approve: (approvalId: string, data?: Record<string, unknown>) => post<PsiApprovalDetail>(`${base}/${approvalId}/approve`, data),
  reject: (approvalId: string, data: Record<string, unknown>) => post<PsiApprovalDetail>(`${base}/${approvalId}/reject`, data),
  returnForChanges: (approvalId: string, data: Record<string, unknown>) => post<PsiApprovalDetail>(`${base}/${approvalId}/return`, data),
  delegate: (approvalId: string, data: Record<string, unknown>) => post<PsiApprovalDetail>(`${base}/${approvalId}/delegate`, data),
  escalate: (approvalId: string, data: Record<string, unknown>) => post<PsiApprovalDetail>(`${base}/${approvalId}/escalate`, data),
  override: (approvalId: string, data: Record<string, unknown>) => post<PsiApprovalDetail>(`${base}/${approvalId}/override`, data),
  addComment: (approvalId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${approvalId}/comments`, data),
  updateComment: (approvalId: string, commentId: string, data: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/${approvalId}/comments/${commentId}`, data),
  deleteComment: (approvalId: string, commentId: string) => remove<Record<string, unknown>>(`${base}/${approvalId}/comments/${commentId}`),
  rules: (params?: Record<string, unknown>) => get<PsiApprovalRule[]>(`${base}/rules`, params),
  createRule: (data: Record<string, unknown>) => post<PsiApprovalRule>(`${base}/rules`, data),
  updateRule: (ruleId: string, data: Record<string, unknown>) => patch<PsiApprovalRule>(`${base}/rules/${ruleId}`, data),
  archiveRule: (ruleId: string, data?: Record<string, unknown>) => post<PsiApprovalRule>(`${base}/rules/${ruleId}/archive`, data),
  applyTemplate: (data?: Record<string, unknown>) => post<PsiApprovalRule>(`${base}/rules/apply-template`, data),
  settings: (params?: Record<string, unknown>) => get<Record<string, unknown>>(`${base}/settings`, params),
  updateSettings: (data: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/settings`, data),
  statuses: () => get<string[]>('/process-safety-information/lookups/psi-approval-statuses'),
  stages: () => get<string[]>('/process-safety-information/lookups/psi-approval-stages'),
  types: () => get<string[]>('/process-safety-information/lookups/psi-approval-types'),
  modules: () => get<string[]>('/process-safety-information/lookups/psi-reviewable-modules'),
  decisions: () => get<string[]>('/process-safety-information/lookups/psi-decision-types'),
  validationStatuses: () => get<string[]>('/process-safety-information/lookups/psi-validation-statuses')
};

export const psiApprovalRequestService = psiReviewApprovalService;
export const psiApprovalRuleService = psiReviewApprovalService;
export const psiApprovalSnapshotService = psiReviewApprovalService;
