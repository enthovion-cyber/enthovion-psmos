import { get, patch, post, remove } from './psi-api';
import type { MaterialCompatibilityDetail, MaterialCompatibilityLookups, MaterialCompatibilityRegistry, MaterialCompatibilitySummary } from '../types/material-compatibility.types';

const base = '/process-safety-information';
const path = `${base}/material-compatibility`;

export const materialCompatibilityService = {
  registry: (params: Record<string, unknown> = {}) => get<MaterialCompatibilityRegistry>(path, params),
  unitRegistry: (unitId: string, params: Record<string, unknown> = {}) => get<MaterialCompatibilityRegistry>(`${base}/units/${unitId}/material-compatibility`, params),
  equipmentRegistry: (equipmentId: string, params: Record<string, unknown> = {}) => get<MaterialCompatibilityRegistry>(`${base}/equipment/${equipmentId}/material-compatibility`, params),
  chemicalRegistry: (chemicalId: string, params: Record<string, unknown> = {}) => get<MaterialCompatibilityRegistry>(`${base}/chemicals/${chemicalId}/material-compatibility`, params),
  summary: (params: Record<string, unknown> = {}) => get<MaterialCompatibilitySummary>(`${path}/summary`, params),
  detail: (compatibilityId: string) => get<MaterialCompatibilityDetail>(`${path}/${compatibilityId}`),
  create: (input: Record<string, unknown>) => post<MaterialCompatibilityDetail>(path, input),
  createForUnit: (unitId: string, input: Record<string, unknown>) => post<MaterialCompatibilityDetail>(`${base}/units/${unitId}/material-compatibility`, input),
  update: (compatibilityId: string, input: Record<string, unknown>) => patch<MaterialCompatibilityDetail>(`${path}/${compatibilityId}`, input),
  archive: (compatibilityId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${compatibilityId}/archive`, input),
  reactivate: (compatibilityId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${compatibilityId}/reactivate`, input),
  clone: (compatibilityId: string, input: Record<string, unknown>) => post<MaterialCompatibilityDetail>(`${path}/${compatibilityId}/clone`, input),
  updateServiceConditions: (compatibilityId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${compatibilityId}/service-conditions`, input),
  updateMaterialDetails: (compatibilityId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${compatibilityId}/material-details`, input),
  updateRating: (compatibilityId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${compatibilityId}/rating`, input),
  addDegradationMechanism: (compatibilityId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${compatibilityId}/degradation-mechanisms`, input),
  updateDegradationMechanism: (compatibilityId: string, mechanismId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${compatibilityId}/degradation-mechanisms/${mechanismId}`, input),
  removeDegradationMechanism: (compatibilityId: string, mechanismId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${path}/${compatibilityId}/degradation-mechanisms/${mechanismId}`, input),
  updateControls: (compatibilityId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${compatibilityId}/controls`, input),
  linkDocument: (compatibilityId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${compatibilityId}/documents/link`, input),
  unlinkDocument: (compatibilityId: string, linkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${path}/${compatibilityId}/documents/${linkId}`, input),
  runCompatibilityCheck: (compatibilityId: string) => post<Record<string, unknown>>(`${path}/${compatibilityId}/compatibility-check/run`, {}),
  runCompleteness: (compatibilityId: string) => post<Record<string, unknown>>(`${path}/${compatibilityId}/completeness/run`, {}),
  runConflictCheck: (compatibilityId: string) => post<Record<string, unknown>>(`${path}/${compatibilityId}/conflict-check/run`, {}),
  overrideConflict: (compatibilityId: string, conflictId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${compatibilityId}/conflicts/${conflictId}/override`, input),
  submitReview: (compatibilityId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${compatibilityId}/submit-review`, input),
  importTemplate: () => get<Record<string, unknown>>(`${path}/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${path}/export`, params),
  lookups: async (): Promise<MaterialCompatibilityLookups> => ({
    materialFamilies: await get<string[]>(`${base}/lookups/material-families`),
    materialGrades: await get<string[]>(`${base}/lookups/material-grades`),
    componentTypes: await get<string[]>(`${base}/lookups/component-types`),
    compatibilityScopes: await get<string[]>(`${base}/lookups/compatibility-scopes`),
    compatibilityRatings: await get<string[]>(`${base}/lookups/compatibility-ratings`),
    ratingConfidence: await get<string[]>(`${base}/lookups/rating-confidence`),
    compatibilityBasis: await get<string[]>(`${base}/lookups/compatibility-basis`),
    degradationMechanisms: await get<string[]>(`${base}/lookups/degradation-mechanisms`),
    exposureTypes: await get<string[]>(`${base}/lookups/exposure-types`),
    compatibilityDocumentTypes: await get<string[]>(`${base}/lookups/compatibility-document-types`),
    materialConflictStatuses: await get<string[]>(`${base}/lookups/material-conflict-statuses`)
  })
};

