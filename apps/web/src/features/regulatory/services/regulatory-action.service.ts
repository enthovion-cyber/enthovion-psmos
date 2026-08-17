import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryActionDashboard, RegulatoryActionDetail, RegulatoryActionLookups, RegulatoryActionRegister } from '../types/regulatory-action.types';

export const regulatoryActionService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryActionDashboard>('/regulatory/actions/dashboard', params),
  summary: (params?: Record<string, unknown>) => get<RegulatoryActionRegister>('/regulatory/actions/summary', params),
  register: (params?: Record<string, unknown>) => get<RegulatoryActionRegister>('/regulatory/actions/register', params),
  filtered: (view: string, params?: Record<string, unknown>) => get<RegulatoryActionRegister>(`/regulatory/actions/${view}`, params),
  create: (data: Record<string, unknown>) => post<RegulatoryActionDetail>('/regulatory/actions', data),
  linkExisting: (data: Record<string, unknown>) => post<RegulatoryActionDetail>('/regulatory/actions/link-existing', data),
  detail: (actionLinkId: string) => get<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}`),
  section: (actionLinkId: string, section: string) => get<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/${section}`),
  update: (actionLinkId: string, data: Record<string, unknown>) => patch<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}`, data),
  sync: (actionLinkId: string, data?: Record<string, unknown>) => post<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/sync`, data ?? {}),
  refreshSnapshot: (actionLinkId: string) => post<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/refresh-snapshot`, {}),
  checkReadiness: (actionLinkId: string) => post<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/closure-readiness/check`, {}),
  verify: (actionLinkId: string, data: Record<string, unknown>) => post<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/verification`, data),
  failVerification: (actionLinkId: string, data: Record<string, unknown>) => post<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/verification/fail`, data),
  effectiveness: (actionLinkId: string, data: Record<string, unknown>) => post<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/effectiveness`, data),
  escalate: (actionLinkId: string, data: Record<string, unknown>) => post<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/escalate`, data),
  archive: (actionLinkId: string, reason: string) => post<RegulatoryActionDetail>(`/regulatory/actions/links/${actionLinkId}/archive`, { reason }),
  source: (sourcePath: string, params?: Record<string, unknown>) => get<RegulatoryActionRegister>(sourcePath, params),
  sourceCreate: (sourcePath: string, data: Record<string, unknown>) => post<RegulatoryActionDetail>(sourcePath, data),
  sourceReadiness: (sourcePath: string, params?: Record<string, unknown>) => get<Record<string, unknown>>(sourcePath, params),
  settings: () => get<Record<string, unknown>>('/regulatory/actions/settings'),
  updateSettings: (data: Record<string, unknown>) => patch<Record<string, unknown>>('/regulatory/actions/settings', data),
  lookups: async (): Promise<RegulatoryActionLookups> => {
    const endpoints: Record<keyof RegulatoryActionLookups, string> = {
      sourceTypes: 'regulatory-action-source-types',
      actionTypes: 'regulatory-action-types',
      actionModes: 'regulatory-action-modes',
      priorities: 'regulatory-action-priorities',
      syncStatuses: 'regulatory-action-sync-statuses',
      closureReadinessStatuses: 'regulatory-action-closure-readiness-statuses',
      verificationStatuses: 'regulatory-action-verification-statuses',
      effectivenessStatuses: 'regulatory-action-effectiveness-statuses',
      capaPackageTypes: 'regulatory-capa-package-types',
      capaPackageStatuses: 'regulatory-capa-package-statuses'
    };
    const keys = Object.keys(endpoints) as Array<keyof RegulatoryActionLookups>;
    const values = await Promise.all(keys.map((key) => get<{ rows: string[] }>(`/regulatory/lookups/${endpoints[key]}`).then((data) => data.rows ?? [])));
    return keys.reduce((acc, key, index) => ({ ...acc, [key]: values[index] }), {} as RegulatoryActionLookups);
  }
};
