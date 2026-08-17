import { get, patch, post, remove } from './psi-api';
import type { SafeguardDetail, SafeguardLookups, SafeguardRegistry, SafeguardSummary } from '../types/safeguard.types';

const base = '/process-safety-information';
const path = `${base}/safeguards`;

export const safeguardService = {
  registry: (params: Record<string, unknown> = {}) => get<SafeguardRegistry>(path, params),
  unitRegistry: (unitId: string, params: Record<string, unknown> = {}) => get<SafeguardRegistry>(`${base}/units/${unitId}/safeguards`, params),
  equipmentRegistry: (equipmentId: string, params: Record<string, unknown> = {}) => get<SafeguardRegistry>(`${base}/equipment/${equipmentId}/safeguards`, params),
  summary: (params: Record<string, unknown> = {}) => get<SafeguardSummary>(`${path}/summary`, params),
  detail: (safeguardId: string) => get<SafeguardDetail>(`${path}/${safeguardId}`),
  create: (input: Record<string, unknown>) => post<SafeguardDetail>(path, input),
  createForUnit: (unitId: string, input: Record<string, unknown>) => post<SafeguardDetail>(`${base}/units/${unitId}/safeguards`, input),
  update: (safeguardId: string, input: Record<string, unknown>) => patch<SafeguardDetail>(`${path}/${safeguardId}`, input),
  archive: (safeguardId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${safeguardId}/archive`, input),
  reactivate: (safeguardId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${safeguardId}/reactivate`, input),
  clone: (safeguardId: string, input: Record<string, unknown>) => post<SafeguardDetail>(`${path}/${safeguardId}/clone`, input),
  addHazard: (safeguardId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${safeguardId}/hazards`, input),
  updateHazard: (safeguardId: string, hazardLinkId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${safeguardId}/hazards/${hazardLinkId}`, input),
  removeHazard: (safeguardId: string, hazardLinkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${path}/${safeguardId}/hazards/${hazardLinkId}`, input),
  updateFunctionRequirements: (safeguardId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${safeguardId}/function-requirements`, input),
  addSourceLink: (safeguardId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${safeguardId}/source-links`, input),
  updateSourceLink: (safeguardId: string, sourceLinkId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${safeguardId}/source-links/${sourceLinkId}`, input),
  removeSourceLink: (safeguardId: string, sourceLinkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${path}/${safeguardId}/source-links/${sourceLinkId}`, input),
  runSourceStatusCheck: (safeguardId: string) => post<Record<string, unknown>>(`${path}/${safeguardId}/source-status-check`, {}),
  compareSource: (safeguardId: string) => post<Record<string, unknown>>(`${path}/${safeguardId}/source-sync/compare-only`, {}),
  pullSource: (safeguardId: string) => post<Record<string, unknown>>(`${path}/${safeguardId}/source-sync/pull`, {}),
  updateEffectiveness: (safeguardId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${safeguardId}/effectiveness`, input),
  updateTestingStatus: (safeguardId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${safeguardId}/testing-status`, input),
  linkDocument: (safeguardId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${safeguardId}/documents/link`, input),
  unlinkDocument: (safeguardId: string, linkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${path}/${safeguardId}/documents/${linkId}`, input),
  runCompleteness: (safeguardId: string) => post<Record<string, unknown>>(`${path}/${safeguardId}/completeness/run`, {}),
  runConflictCheck: (safeguardId: string) => post<Record<string, unknown>>(`${path}/${safeguardId}/conflict-check/run`, {}),
  overrideConflict: (safeguardId: string, conflictId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${safeguardId}/conflicts/${conflictId}/override`, input),
  submitReview: (safeguardId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${safeguardId}/submit-review`, input),
  importTemplate: () => get<Record<string, unknown>>(`${path}/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${path}/export`, params),
  lookups: async (): Promise<SafeguardLookups> => ({
    categories: await get<string[]>(`${base}/lookups/safeguard-categories`),
    types: await get<string[]>(`${base}/lookups/safeguard-types`),
    functionTypes: await get<string[]>(`${base}/lookups/safeguard-function-types`),
    criticalities: await get<string[]>(`${base}/lookups/safeguard-criticalities`),
    sourceModules: await get<string[]>(`${base}/lookups/safeguard-source-modules`),
    effectivenessStatuses: await get<string[]>(`${base}/lookups/safeguard-effectiveness-statuses`),
    iplQualificationStatuses: await get<string[]>(`${base}/lookups/ipl-qualification-statuses`),
    testingStatuses: await get<string[]>(`${base}/lookups/safeguard-testing-statuses`),
    conflictStatuses: await get<string[]>(`${base}/lookups/safeguard-conflict-statuses`),
    documentTypes: await get<string[]>(`${base}/lookups/safeguard-document-types`)
  })
};
