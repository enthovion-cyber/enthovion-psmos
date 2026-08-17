import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryComplianceDashboard, RegulatoryComplianceDetail, RegulatoryComplianceGap, RegulatoryComplianceLookups, RegulatoryComplianceRegister } from '../types/regulatory-compliance.types';

export const regulatoryComplianceService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryComplianceDashboard>('/regulatory/compliance-status/dashboard', params),
  register: (params?: Record<string, unknown>) => get<RegulatoryComplianceRegister>('/regulatory/compliance-status/register', params),
  filtered: (view: string, params?: Record<string, unknown>) => get<RegulatoryComplianceRegister>(`/regulatory/compliance-status/${view}`, params),
  assessments: (params?: Record<string, unknown>) => get<RegulatoryComplianceRegister>('/regulatory/compliance-status/assessments', params),
  detail: (assessmentId: string) => get<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}`),
  section: (assessmentId: string, section: string) => get<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}/${section}`),
  create: (data: Record<string, unknown>) => post<RegulatoryComplianceDetail>('/regulatory/compliance-status/assessments', data),
  update: (assessmentId: string, data: Record<string, unknown>) => patch<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}`, data),
  runReadiness: (assessmentId: string) => post<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}/run-readiness-check`, {}),
  changeStatus: (assessmentId: string, data: Record<string, unknown>) => post<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}/change-status`, data),
  complete: (assessmentId: string, data?: Record<string, unknown>) => post<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}/complete`, data ?? {}),
  submitReview: (assessmentId: string, data?: Record<string, unknown>) => post<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}/submit-review`, data ?? {}),
  markStale: (assessmentId: string, data: Record<string, unknown>) => post<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}/mark-stale`, data),
  archive: (assessmentId: string, reason: string) => post<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}/archive`, { reason }),
  upsertCriterion: (assessmentId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/compliance-status/assessments/${assessmentId}/criteria`, data),
  recalculateEvidence: (assessmentId: string) => post<RegulatoryComplianceDetail>(`/regulatory/compliance-status/assessments/${assessmentId}/evidence-readiness/recalculate`, {}),
  gaps: (params?: Record<string, unknown>) => get<{ rows: RegulatoryComplianceGap[]; total?: number; summary?: Record<string, unknown> }>('/regulatory/compliance-status/gaps', params),
  detectGaps: (data?: Record<string, unknown>) => post<{ rows: RegulatoryComplianceGap[]; total: number }>('/regulatory/compliance-status/gaps/detect', data ?? {}),
  createGap: (data: Record<string, unknown>) => post<RegulatoryComplianceGap>('/regulatory/compliance-status/gaps', data),
  updateGap: (gapId: string, data: Record<string, unknown>) => patch<RegulatoryComplianceGap>(`/regulatory/compliance-status/gaps/${gapId}`, data),
  resolveGap: (gapId: string, reason: string) => post<RegulatoryComplianceGap>(`/regulatory/compliance-status/gaps/${gapId}/resolve`, { reason }),
  archiveGap: (gapId: string, reason: string) => post<RegulatoryComplianceGap>(`/regulatory/compliance-status/gaps/${gapId}/archive`, { reason }),
  createActionFoundation: (gapId: string, data?: Record<string, unknown>) => post<RegulatoryComplianceGap>(`/regulatory/compliance-status/gaps/${gapId}/create-action-foundation`, data ?? {}),
  linkCapaFoundation: (gapId: string, data?: Record<string, unknown>) => post<RegulatoryComplianceGap>(`/regulatory/compliance-status/gaps/${gapId}/link-capa-foundation`, data ?? {}),
  matrix: (params?: Record<string, unknown>) => get<RegulatoryComplianceRegister & { columns?: string[]; view?: string }>('/regulatory/compliance-status/matrix', params),
  history: (params?: Record<string, unknown>) => get<{ rows: unknown[]; summary?: Record<string, unknown> }>('/regulatory/compliance-status/history', params),
  rollup: (regulationId: string) => get<Record<string, unknown>>(`/regulatory/compliance-status/rollups/${regulationId}`),
  recalculateRollup: (regulationId: string) => post<Record<string, unknown>>(`/regulatory/compliance-status/rollups/${regulationId}/recalculate`, {}),
  sourceItem: (regulationId: string, params?: Record<string, unknown>) => get<RegulatoryComplianceRegister>(`/regulatory/${regulationId}/compliance-status`, params),
  sourceObligation: (obligationId: string, params?: Record<string, unknown>) => get<RegulatoryComplianceRegister>(`/regulatory/obligations/${obligationId}/compliance-status`, params),
  scoped: (scope: 'sites' | 'units' | 'areas' | 'equipment', id: string, params?: Record<string, unknown>) => get<RegulatoryComplianceRegister>(`/regulatory/${scope}/${id}/compliance-status`, params),
  lookups: async (): Promise<RegulatoryComplianceLookups> => {
    const endpoints: Record<keyof RegulatoryComplianceLookups, string> = {
      complianceStatuses: 'compliance-statuses',
      complianceAssessmentStatuses: 'compliance-assessment-statuses',
      complianceEvidenceReadinessStatuses: 'compliance-evidence-readiness-statuses',
      complianceCriteriaStatuses: 'compliance-criteria-statuses',
      complianceGapTypes: 'compliance-gap-types',
      complianceGapStatuses: 'compliance-gap-statuses',
      complianceGapSeverities: 'compliance-gap-severities',
      complianceStaleStatuses: 'compliance-stale-statuses',
      complianceSourceTypes: 'compliance-source-types',
      criticalityLevels: 'criticality-levels'
    };
    const keys = Object.keys(endpoints) as Array<keyof RegulatoryComplianceLookups>;
    const values = await Promise.all(keys.map((key) => get<{ rows: string[] }>(`/regulatory/lookups/${endpoints[key]}`).then((data) => data.rows ?? [])));
    return keys.reduce((acc, key, index) => ({ ...acc, [key]: values[index] }), {} as RegulatoryComplianceLookups);
  }
};
