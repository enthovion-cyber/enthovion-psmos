import { get, post } from './training-api';
import type { TrainingApprovalPackageDetail, TrainingApprovalPaged, TrainingApprovalRow } from '../types/training-review-approval.types';

const base = '/training-competency/review-approval/packages';

export const trainingApprovalPackageService = {
  list: (params: Record<string, unknown> = {}) => get<TrainingApprovalPaged>(base, params),
  detail: (approvalId: string) => get<TrainingApprovalPackageDetail>(`${base}/${approvalId}`),
  snapshot: (approvalId: string) => get<TrainingApprovalRow>(`${base}/${approvalId}/snapshot`),
  evidence: (approvalId: string) => get<TrainingApprovalPaged>(`${base}/${approvalId}/evidence`),
  history: (approvalId: string, params: Record<string, unknown> = {}) => get<TrainingApprovalPaged>(`${base}/${approvalId}/history`, params),
  create: (data: Record<string, any>) => post<TrainingApprovalPackageDetail>(base, data),
  validate: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/validate`, data),
  approve: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/approve`, data),
  approveWithConditions: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/approve-with-conditions`, data),
  reject: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/reject`, data),
  returnForCorrection: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/return`, data),
  requestCorrection: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/request-correction`, data),
  escalate: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/escalate`, data),
  reassign: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/reassign`, data),
  cancel: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalRow>(`${base}/${approvalId}/cancel`, data),
  resubmit: (approvalId: string, data: Record<string, any> = {}) => post<TrainingApprovalPackageDetail>(`${base}/${approvalId}/resubmit`, data),
  comment: (approvalId: string, data: Record<string, any>) => post<TrainingApprovalRow>(`${base}/${approvalId}/comment`, data)
};
