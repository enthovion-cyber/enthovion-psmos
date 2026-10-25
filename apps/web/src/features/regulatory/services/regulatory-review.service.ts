import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryReviewDashboard, RegulatoryReviewPackageDetail, RegulatoryReviewRegister, RegulatoryReviewSummary } from '../types/regulatory-review.types';

export const regulatoryReviewService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryReviewDashboard>('/regulatory/review-approval/dashboard', params),
  summary: (params?: Record<string, unknown>) => get<RegulatoryReviewSummary>('/regulatory/review-approval/dashboard/summary', params),
  register: (params?: Record<string, unknown>) => get<RegulatoryReviewRegister>('/regulatory/review-approval/packages', params),
  inbox: (params?: Record<string, unknown>) => get<RegulatoryReviewRegister>('/regulatory/review-approval/inbox', params),
  submissions: (params?: Record<string, unknown>) => get<RegulatoryReviewRegister>('/regulatory/review-approval/my-submissions', params),
  filtered: (view: string, params?: Record<string, unknown>) => get<RegulatoryReviewRegister>(`/regulatory/review-approval/${view}`, params),
  detail: (approvalId: string) => get<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}`),
  section: (approvalId: string, section: string) => get<Record<string, unknown>>(`/regulatory/review-approval/packages/${approvalId}/${section}`),
  create: (data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>('/regulatory/review-approval/packages', data),
  update: (approvalId: string, data: Record<string, unknown>) => patch<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}`, data),
  submit: (approvalId: string, data?: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/submit`, data ?? {}),
  runValidation: (approvalId: string, data?: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/review-approval/packages/${approvalId}/run-validation`, data ?? {}),
  approve: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/approve`, data),
  approveWithConditions: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/approve-with-conditions`, data),
  reject: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/reject`, data),
  returnForCorrection: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/return`, data),
  requestInfo: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/request-info`, data),
  eSign: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/e-sign`, data),
  refreshSnapshot: (approvalId: string, data?: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/refresh-snapshot`, data ?? {}),
  markStale: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/mark-stale`, data),
  cancel: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/cancel`, data),
  archive: (approvalId: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(`/regulatory/review-approval/packages/${approvalId}/archive`, data),
  rules: (params?: Record<string, unknown>) => get<{ rows: Array<Record<string, unknown>> }>('/regulatory/review-approval/rules', params),
  createRule: (data: Record<string, unknown>) => post<Record<string, unknown>>('/regulatory/review-approval/rules', data),
  sourceReview: (sourcePath: string) => get<Record<string, unknown>>(sourcePath),
  submitSourceReview: (sourcePath: string, data: Record<string, unknown>) => post<RegulatoryReviewPackageDetail>(sourcePath, data)
};
