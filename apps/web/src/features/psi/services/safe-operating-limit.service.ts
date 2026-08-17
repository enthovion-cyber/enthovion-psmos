import { get, patch, post, remove } from './psi-api';
import type { SafeOperatingLimitDetail, SafeOperatingLimitLookups, SafeOperatingLimitRegistry, SafeOperatingLimitSummary } from '../types/safe-operating-limit.types';

const base = '/process-safety-information';

export const safeOperatingLimitService = {
  registry: (params: Record<string, unknown> = {}) => get<SafeOperatingLimitRegistry>(`${base}/safe-operating-limits`, params),
  unitRegistry: (unitId: string, params: Record<string, unknown> = {}) => get<SafeOperatingLimitRegistry>(`${base}/units/${unitId}/safe-operating-limits`, params),
  equipmentRegistry: (equipmentId: string, params: Record<string, unknown> = {}) => get<SafeOperatingLimitRegistry>(`${base}/equipment/${equipmentId}/safe-operating-limits`, params),
  summary: (params: Record<string, unknown> = {}) => get<SafeOperatingLimitSummary>(`${base}/safe-operating-limits/summary`, params),
  detail: (limitId: string) => get<SafeOperatingLimitDetail>(`${base}/safe-operating-limits/${limitId}`),
  create: (input: Record<string, unknown>) => post<SafeOperatingLimitDetail>(`${base}/safe-operating-limits`, input),
  createForUnit: (unitId: string, input: Record<string, unknown>) => post<SafeOperatingLimitDetail>(`${base}/units/${unitId}/safe-operating-limits`, input),
  update: (limitId: string, input: Record<string, unknown>) => patch<SafeOperatingLimitDetail>(`${base}/safe-operating-limits/${limitId}`, input),
  archive: (limitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/safe-operating-limits/${limitId}/archive`, input),
  reactivate: (limitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/safe-operating-limits/${limitId}/reactivate`, input),
  clone: (limitId: string, input: Record<string, unknown>) => post<SafeOperatingLimitDetail>(`${base}/safe-operating-limits/${limitId}/clone`, input),
  updateValues: (limitId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/safe-operating-limits/${limitId}/values`, input),
  consequences: (limitId: string) => get<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/consequences`),
  saveConsequence: (limitId: string, input: Record<string, unknown>, consequenceId?: string) => consequenceId ? patch<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/consequences/${consequenceId}`, input) : post<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/consequences`, input),
  removeConsequence: (limitId: string, consequenceId: string) => remove<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/consequences/${consequenceId}`),
  saveOperatorResponse: (limitId: string, input: Record<string, unknown>, responseId?: string) => responseId ? patch<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/operator-responses/${responseId}`, input) : post<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/operator-responses`, input),
  removeOperatorResponse: (limitId: string, responseId: string) => remove<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/operator-responses/${responseId}`),
  saveControl: (limitId: string, input: Record<string, unknown>, controlId?: string) => controlId ? patch<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/controls/${controlId}`, input) : post<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/controls`, input),
  removeControl: (limitId: string, controlId: string) => remove<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/controls/${controlId}`),
  runCompleteness: (limitId: string) => post<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/completeness/run`),
  runConflictCheck: (limitId: string) => post<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/conflict-check/run`),
  overrideConflict: (limitId: string, conflictId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/conflicts/${conflictId}/override`, input),
  submitReview: (limitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/safe-operating-limits/${limitId}/submit-review`, input),
  linkDocument: (limitId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/documents/link`, input),
  unlinkDocument: (limitId: string, documentLinkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>[]>(`${base}/safe-operating-limits/${limitId}/documents/${documentLinkId}`, input),
  importTemplate: () => get<Record<string, unknown>>(`${base}/safe-operating-limits/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/safe-operating-limits/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${base}/safe-operating-limits/export`, params),
  lookups: async (): Promise<SafeOperatingLimitLookups> => ({
    parameterTypes: await get<string[]>(`${base}/lookups/parameter-types`),
    limitScopes: await get<string[]>(`${base}/lookups/limit-scopes`),
    operatingModes: await get<string[]>(`${base}/lookups/operating-modes`),
    limitCriticalities: await get<string[]>(`${base}/lookups/limit-criticalities`),
    deviationDirections: await get<string[]>(`${base}/lookups/deviation-directions`),
    consequenceSeverities: await get<string[]>(`${base}/lookups/consequence-severities`),
    solControlTypes: await get<string[]>(`${base}/lookups/sol-control-types`),
    conflictStatuses: await get<string[]>(`${base}/lookups/conflict-statuses`)
  })
};
