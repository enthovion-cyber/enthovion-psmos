import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryApplicabilityAssessmentDetail, RegulatoryApplicabilityDashboard, RegulatoryApplicabilityMatrix, RegulatoryList, RegulatoryRow } from '../types/regulatory-applicability.types';

export const regulatoryApplicabilityService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryApplicabilityDashboard>('/regulatory/applicability/dashboard', params),
  matrix: (params?: Record<string, unknown>) => get<RegulatoryApplicabilityMatrix>('/regulatory/applicability/matrix', params),
  assessments: (params?: Record<string, unknown>) => get<RegulatoryList>('/regulatory/applicability/assessments', params),
  filtered: (view: string, params?: Record<string, unknown>) => get<RegulatoryList>(`/regulatory/applicability/${view}`, params),
  detail: (id: string) => get<RegulatoryApplicabilityAssessmentDetail>(`/regulatory/applicability/assessments/${id}`),
  create: (data: RegulatoryRow) => post<RegulatoryApplicabilityAssessmentDetail>('/regulatory/applicability/assessments', data),
  update: (id: string, data: RegulatoryRow) => patch<RegulatoryApplicabilityAssessmentDetail>(`/regulatory/applicability/assessments/${id}`, data),
  answer: (id: string, data: RegulatoryRow) => post<RegulatoryRow>(`/regulatory/applicability/assessments/${id}/answer`, data),
  runGapCheck: (id: string) => post<RegulatoryList>(`/regulatory/applicability/assessments/${id}/run-gap-check`),
  saveDecision: (id: string, data: RegulatoryRow) => post<RegulatoryApplicabilityAssessmentDetail>(`/regulatory/applicability/assessments/${id}/save-decision`, data),
  submitReview: (id: string, data: RegulatoryRow) => post<RegulatoryApplicabilityAssessmentDetail>(`/regulatory/applicability/assessments/${id}/submit-review`, data),
  markStale: (id: string, data: RegulatoryRow) => post<RegulatoryApplicabilityAssessmentDetail>(`/regulatory/applicability/assessments/${id}/mark-stale`, data),
  archive: (id: string, reason: string) => post<RegulatoryRow>(`/regulatory/applicability/assessments/${id}/archive`, { reason }),
  questions: (id: string) => get<RegulatoryRow>(`/regulatory/applicability/assessments/${id}/questions`),
  scope: (id: string) => get<RegulatoryRow>(`/regulatory/applicability/assessments/${id}/scope`),
  decision: (id: string) => get<RegulatoryRow>(`/regulatory/applicability/assessments/${id}/decision`),
  gaps: (id: string) => get<RegulatoryList>(`/regulatory/applicability/assessments/${id}/gaps`),
  history: (id: string) => get<RegulatoryList>(`/regulatory/applicability/assessments/${id}/history`),
  item: (itemId: string) => get<RegulatoryRow>(`/regulatory/${itemId}/applicability`),
  createForItem: (itemId: string, data: RegulatoryRow) => post<RegulatoryApplicabilityAssessmentDetail>(`/regulatory/${itemId}/applicability/new-assessment`, data),
  decisionForItem: (itemId: string, data: RegulatoryRow) => post<RegulatoryApplicabilityAssessmentDetail>(`/regulatory/${itemId}/applicability/decision`, data)
};
