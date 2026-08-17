import { get, patch, post, remove } from '@/features/audit/services/audit-api';
import type { RegulatoryAuditMappingDashboard, RegulatoryAuditMappingDetail, RegulatoryAuditMappingGap, RegulatoryAuditMappingLookups, RegulatoryAuditMappingRegister, RegulatoryAuditMappingRow } from '../types/regulatory-audit-mapping.types';

export const regulatoryAuditMappingService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryAuditMappingDashboard>('/regulatory/audit-mapping/dashboard', params),
  dashboardGroup: (group: 'by-site' | 'by-obligation' | 'by-audit-program' | 'by-coverage' | 'gaps' | 'stale' | 'recent', params?: Record<string, unknown>) => get<Record<string, unknown>>(`/regulatory/audit-mapping/dashboard/${group}`, params),
  register: (params?: Record<string, unknown>) => get<RegulatoryAuditMappingRegister>('/regulatory/audit-mapping/register', params),
  filtered: (view: string, params?: Record<string, unknown>) => get<RegulatoryAuditMappingRegister>(`/regulatory/audit-mapping/${view}`, params),
  summary: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/regulatory/audit-mapping/summary', params),
  detail: (mappingId: string) => get<RegulatoryAuditMappingDetail>(`/regulatory/audit-mapping/${mappingId}`),
  section: (mappingId: string, section: string) => get<RegulatoryAuditMappingDetail | Record<string, unknown>>(`/regulatory/audit-mapping/${mappingId}/${section}`),
  create: (data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>('/regulatory/audit-mapping', data),
  update: (mappingId: string, data: Record<string, unknown>) => patch<RegulatoryAuditMappingDetail>(`/regulatory/audit-mapping/${mappingId}`, data),
  verify: (mappingId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>(`/regulatory/audit-mapping/${mappingId}/verify`, data),
  reject: (mappingId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>(`/regulatory/audit-mapping/${mappingId}/reject`, data),
  submitReview: (mappingId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>(`/regulatory/audit-mapping/${mappingId}/review`, data),
  recalculateCoverage: (mappingId: string, data?: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/audit-mapping/${mappingId}/recalculate-coverage`, data ?? {}),
  refreshSnapshot: (mappingId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>(`/regulatory/audit-mapping/${mappingId}/refresh-snapshot`, data),
  markStale: (mappingId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>(`/regulatory/audit-mapping/${mappingId}/mark-stale`, data),
  archive: (mappingId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>(`/regulatory/audit-mapping/${mappingId}/archive`, data),
  linkTarget: (mappingId: string, target: 'audit-program' | 'audit-plan' | 'checklist' | 'execution' | 'finding' | 'capa' | 'evidence' | 'score', data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/audit-mapping/${mappingId}/link-${target}`, data),
  removeLink: (mappingId: string, linkId: string, data: Record<string, unknown>) => remove<Record<string, unknown>>(`/regulatory/audit-mapping/${mappingId}/links/${linkId}`, data),
  matrix: (params?: Record<string, unknown>) => get<{ rows?: Record<string, unknown>[]; summary?: Record<string, unknown> }>('/regulatory/audit-mapping/matrix', params),
  coverage: (params?: Record<string, unknown>) => get<{ rows?: Record<string, unknown>[]; summary?: Record<string, unknown> }>('/regulatory/audit-mapping/coverage', params),
  traceability: (params?: Record<string, unknown>) => get<{ rows?: Record<string, unknown>[]; summary?: Record<string, unknown> }>('/regulatory/audit-mapping/traceability', params),
  createTraceabilitySnapshot: (data: Record<string, unknown>) => post<Record<string, unknown>>('/regulatory/audit-mapping/traceability/snapshot', data),
  gaps: (params?: Record<string, unknown>) => get<{ rows?: RegulatoryAuditMappingGap[]; summary?: Record<string, unknown> }>('/regulatory/audit-mapping/gaps', params),
  detectGaps: (data?: Record<string, unknown>) => post<{ rows?: RegulatoryAuditMappingGap[]; created?: number }>('/regulatory/audit-mapping/gaps/detect', data ?? {}),
  createGap: (data: Record<string, unknown>) => post<RegulatoryAuditMappingGap>('/regulatory/audit-mapping/gaps', data),
  gap: (gapId: string) => get<RegulatoryAuditMappingGap>(`/regulatory/audit-mapping/gaps/${gapId}`),
  updateGap: (gapId: string, data: Record<string, unknown>) => patch<RegulatoryAuditMappingGap>(`/regulatory/audit-mapping/gaps/${gapId}`, data),
  resolveGap: (gapId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingGap>(`/regulatory/audit-mapping/gaps/${gapId}/resolve`, data),
  archiveGap: (gapId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingGap>(`/regulatory/audit-mapping/gaps/${gapId}/archive`, data),
  createGapActionFoundation: (gapId: string, data?: Record<string, unknown>) => post<RegulatoryAuditMappingGap>(`/regulatory/audit-mapping/gaps/${gapId}/create-action-foundation`, data ?? {}),
  history: (params?: Record<string, unknown>) => get<{ rows?: Record<string, unknown>[]; summary?: Record<string, unknown> }>('/regulatory/audit-mapping/history', params),
  settings: () => get<Record<string, unknown>>('/regulatory/audit-mapping/settings'),
  updateSettings: (data: Record<string, unknown>) => patch<Record<string, unknown>>('/regulatory/audit-mapping/settings', data),
  sourceItem: (regulationId: string, params?: Record<string, unknown>) => get<RegulatoryAuditMappingRegister>(`/regulatory/${regulationId}/audit-mapping`, params),
  createSourceItem: (regulationId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>(`/regulatory/${regulationId}/audit-mapping`, data),
  sourceObligation: (obligationId: string, params?: Record<string, unknown>) => get<RegulatoryAuditMappingRegister>(`/regulatory/obligations/${obligationId}/audit-mapping`, params),
  createSourceObligation: (obligationId: string, data: Record<string, unknown>) => post<RegulatoryAuditMappingDetail>(`/regulatory/obligations/${obligationId}/audit-mapping`, data),
  scoped: (scope: 'sites' | 'units' | 'areas' | 'equipment', id: string, params?: Record<string, unknown>) => get<RegulatoryAuditMappingRegister>(`/regulatory/${scope}/${id}/audit-mapping`, params),
  auditScoped: (scopePath: string, id: string, params?: Record<string, unknown>) => get<RegulatoryAuditMappingRegister>(`/audit-compliance/${scopePath}/${id}/regulatory-mapping`, params),
  rowsFromSource: (source: 'compliance-status/assessments' | 'compliance-status/gaps' | 'evidence/links' | 'evidence/packages', id: string, params?: Record<string, unknown>) => get<RegulatoryAuditMappingRegister>(`/regulatory/${source}/${id}/audit-mapping`, params),
  lookups: async (): Promise<RegulatoryAuditMappingLookups> => {
    const endpoints: Record<keyof RegulatoryAuditMappingLookups, string> = {
      auditMappingTypes: 'audit-mapping-types',
      auditMappingSourceTypes: 'audit-mapping-source-types',
      auditTargetTypes: 'audit-target-types',
      auditMappingStatuses: 'audit-mapping-statuses',
      auditCoverageStatuses: 'audit-coverage-statuses',
      auditVerificationStatuses: 'audit-verification-statuses',
      auditMappingGapTypes: 'audit-mapping-gap-types',
      auditMappingStaleStatuses: 'audit-mapping-stale-statuses'
    };
    const keys = Object.keys(endpoints) as Array<keyof RegulatoryAuditMappingLookups>;
    const values = await Promise.all(keys.map((key) => get<{ rows?: string[] }>(`/regulatory/lookups/${endpoints[key]}`).then((data) => data.rows ?? [])));
    return keys.reduce((acc, key, index) => ({ ...acc, [key]: values[index] }), {} as RegulatoryAuditMappingLookups);
  }
};

export type RegulatoryAuditMappingMutationResult = RegulatoryAuditMappingDetail | RegulatoryAuditMappingRow | RegulatoryAuditMappingGap | Record<string, unknown>;
