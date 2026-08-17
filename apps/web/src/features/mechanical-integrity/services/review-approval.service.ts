import { get, patch, post } from './safeguard-api';
import type { MiApprovalDashboardResponse, MiApprovalDetailResponse, MiApprovalRule } from '../types/review-approval.types';

const base = '/mechanical-integrity/review-approval';

export const reviewApprovalService = {
  list: (params: Record<string, unknown> = {}) => get<MiApprovalDashboardResponse>(base, params),
  summary: (params: Record<string, unknown> = {}) => get<Record<string, number>>(`${base}/summary`, params),
  inbox: (params: Record<string, unknown> = {}) => get<MiApprovalDashboardResponse>(`${base}/inbox`, params),
  myApprovals: (params: Record<string, unknown> = {}) => get<MiApprovalDashboardResponse>(`${base}/my-approvals`, params),
  pending: (params: Record<string, unknown> = {}) => get<MiApprovalDashboardResponse>(`${base}/pending`, params),
  overdue: (params: Record<string, unknown> = {}) => get<MiApprovalDashboardResponse>(`${base}/overdue`, params),
  escalated: (params: Record<string, unknown> = {}) => get<MiApprovalDashboardResponse>(`${base}/escalated`, params),
  completed: (params: Record<string, unknown> = {}) => get<MiApprovalDashboardResponse>(`${base}/completed`, params),
  detail: (approvalId: string) => get<MiApprovalDetailResponse>(`${base}/${approvalId}`),
  submit: (input: Record<string, unknown>) => post<MiApprovalDetailResponse>(`${base}/submit`, input),
  approve: (approvalId: string, input: Record<string, unknown>) => post<MiApprovalDetailResponse>(`${base}/${approvalId}/approve`, input),
  reject: (approvalId: string, input: Record<string, unknown>) => post<MiApprovalDetailResponse>(`${base}/${approvalId}/reject`, input),
  returnForCorrection: (approvalId: string, input: Record<string, unknown>) => post<MiApprovalDetailResponse>(`${base}/${approvalId}/return-for-correction`, input),
  approveWithConditions: (approvalId: string, input: Record<string, unknown>) => post<MiApprovalDetailResponse>(`${base}/${approvalId}/approve-with-conditions`, input),
  requestInfo: (approvalId: string, input: Record<string, unknown>) => post<MiApprovalDetailResponse>(`${base}/${approvalId}/request-info`, input),
  delegate: (approvalId: string, input: Record<string, unknown>) => post<MiApprovalDetailResponse>(`${base}/${approvalId}/delegate`, input),
  escalate: (approvalId: string, input: Record<string, unknown>) => post<MiApprovalDetailResponse>(`${base}/${approvalId}/escalate`, input),
  runValidations: (approvalId: string) => post<Array<Record<string, unknown>>>(`${base}/${approvalId}/run-validations`),
  addComment: (approvalId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${approvalId}/comments`, input),
  addCondition: (approvalId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${approvalId}/conditions`, input),
  rules: (params: Record<string, unknown> = {}) => get<MiApprovalRule[]>(`${base}/config/rules`, params),
  createRule: (input: Record<string, unknown>) => post<MiApprovalRule>(`${base}/config/rules`, input),
  updateRule: (ruleId: string, input: Record<string, unknown>) => patch<MiApprovalRule>(`${base}/config/rules/${ruleId}`, input),
  archiveRule: (ruleId: string) => post<MiApprovalRule>(`${base}/config/rules/${ruleId}/archive`),
  lookups: () => Promise.all([
    get<string[]>('/mechanical-integrity/lookups/approval-statuses'),
    get<string[]>('/mechanical-integrity/lookups/approval-actions'),
    get<string[]>('/mechanical-integrity/lookups/approval-stages'),
    get<string[]>('/mechanical-integrity/lookups/approval-source-modules')
  ]).then(([approvalStatuses, approvalActions, approvalStages, approvalSourceModules]) => ({ approvalStatuses, approvalActions, approvalStages, approvalSourceModules }))
};
