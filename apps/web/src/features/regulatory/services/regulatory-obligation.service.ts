import { get, patch, post, remove } from '@/features/audit/services/audit-api';
import type { RegulatoryObligationDashboard, RegulatoryObligationDetail, RegulatoryObligationGap, RegulatoryObligationLookups, RegulatoryObligationRegister } from '../types/regulatory-obligation.types';

export const regulatoryObligationService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryObligationDashboard>('/regulatory/obligations/dashboard', params),
  register: (params?: Record<string, unknown>) => get<RegulatoryObligationRegister>('/regulatory/obligations/register', params),
  filtered: (view: string, params?: Record<string, unknown>) => get<RegulatoryObligationRegister>(`/regulatory/obligations/${view}`, params),
  matrix: (params?: Record<string, unknown>) => get<RegulatoryObligationRegister & { columns?: string[]; view?: string }>('/regulatory/obligations/matrix', params),
  gaps: (params?: Record<string, unknown>) => get<{ rows: RegulatoryObligationGap[]; total?: number }>('/regulatory/obligations/gaps', params),
  detail: (id: string) => get<RegulatoryObligationDetail>(`/regulatory/obligations/${id}`),
  section: (id: string, section: string) => get<RegulatoryObligationDetail>(`/regulatory/obligations/${id}/${section}`),
  create: (data: Record<string, unknown>) => post<RegulatoryObligationDetail>('/regulatory/obligations', data),
  update: (id: string, data: Record<string, unknown>) => patch<RegulatoryObligationDetail>(`/regulatory/obligations/${id}`, data),
  archive: (id: string, reason: string) => post<RegulatoryObligationDetail>(`/regulatory/obligations/${id}/archive`, { reason }),
  assignOwner: (id: string, ownerUserId: string, reason: string) => post<RegulatoryObligationDetail>(`/regulatory/obligations/${id}/assign-owner`, { ownerUserId, reason }),
  changeApplicability: (id: string, data: Record<string, unknown>) => post<RegulatoryObligationDetail>(`/regulatory/obligations/${id}/change-applicability`, data),
  changeCompliance: (id: string, data: Record<string, unknown>) => post<RegulatoryObligationDetail>(`/regulatory/obligations/${id}/change-compliance-status`, data),
  markStale: (id: string, data: Record<string, unknown>) => post<RegulatoryObligationDetail>(`/regulatory/obligations/${id}/mark-stale`, data),
  upsertEvidenceExpectation: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/obligations/${id}/evidence-expectations`, data),
  upsertModuleMapping: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/obligations/${id}/module-mapping`, data),
  createLink: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/obligations/${id}/links`, data),
  removeLink: (id: string, linkId: string, data?: Record<string, unknown>) => remove<Record<string, unknown>>(`/regulatory/obligations/${id}/links/${linkId}`, data),
  detectGaps: (data?: Record<string, unknown>) => post<{ rows: RegulatoryObligationGap[]; total: number }>('/regulatory/obligations/gaps/detect', data),
  createGap: (data: Record<string, unknown>) => post<RegulatoryObligationGap>('/regulatory/obligations/gaps', data),
  resolveGap: (gapId: string, reason: string) => post<RegulatoryObligationGap>(`/regulatory/obligations/gaps/${gapId}/resolve`, { reason }),
  createGapAction: (gapId: string, data?: Record<string, unknown>) => post<RegulatoryObligationGap>(`/regulatory/obligations/gaps/${gapId}/create-action-foundation`, data),
  itemObligations: (regulationId: string, params?: Record<string, unknown>) => get<RegulatoryObligationRegister>(`/regulatory/${regulationId}/obligations`, params),
  lookups: async (): Promise<RegulatoryObligationLookups> => {
    const keys = ['obligationTypes', 'obligationCategories', 'obligationStatuses', 'obligationFrequencies', 'obligationTriggerEvents', 'evidenceExpectationStatuses', 'moduleMappingStatuses', 'obligationGapTypes', 'obligationStaleStatuses', 'criticalityLevels', 'complianceStatuses', 'linkModules'] as const;
    const endpoints: Record<string, string> = {
      obligationTypes: 'obligation-types',
      obligationCategories: 'obligation-categories',
      obligationStatuses: 'obligation-statuses',
      obligationFrequencies: 'obligation-frequencies',
      obligationTriggerEvents: 'obligation-trigger-events',
      evidenceExpectationStatuses: 'evidence-expectation-statuses',
      moduleMappingStatuses: 'module-mapping-statuses',
      obligationGapTypes: 'obligation-gap-types',
      obligationStaleStatuses: 'obligation-stale-statuses',
      criticalityLevels: 'criticality-levels',
      complianceStatuses: 'compliance-statuses',
      linkModules: 'link-modules'
    };
    const values = await Promise.all(keys.map((key) => get<{ rows: string[] }>(`/regulatory/lookups/${endpoints[key]}`).then((data) => data.rows ?? [])));
    return keys.reduce((acc, key, index) => ({ ...acc, [key]: values[index] }), {} as RegulatoryObligationLookups);
  }
};
