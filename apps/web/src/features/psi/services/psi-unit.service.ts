import type { PsiUnitDetailResponse, PsiUnitRegistryResponse } from '../types/psi-unit.types';
import { get, patch, post, remove } from './psi-api';

const base = '/process-safety-information';

export const psiUnitService = {
  units: (params: Record<string, unknown> = {}) => get<PsiUnitRegistryResponse>(`${base}/units`, params),
  get: (unitId: string) => get<PsiUnitDetailResponse>(`${base}/units/${unitId}`),
  create: (input: Record<string, unknown>) => post<PsiUnitDetailResponse>(`${base}/units`, input),
  update: (unitId: string, input: Record<string, unknown>) => patch<PsiUnitDetailResponse>(`${base}/units/${unitId}`, input),
  archive: (unitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/units/${unitId}/archive`, input),
  reactivate: (unitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/units/${unitId}/reactivate`, input),
  lookups: () => Promise.all([
    get<string[]>(`${base}/lookups/unit-types`),
    get<string[]>(`${base}/lookups/unit-statuses`),
    get<string[]>(`${base}/lookups/psi-statuses`),
    get<string[]>(`${base}/lookups/completeness-categories`)
  ]).then(([unitTypes, unitStatuses, psiStatuses, completenessCategories]) => ({ unitTypes, unitStatuses, psiStatuses, completenessCategories })),
  equipmentLookup: (search = '') => get<Array<Record<string, unknown>>>(`${base}/lookups/equipment`, { search }),
  unitFormSites: () => get<Array<Record<string, unknown>>>(`${base}/unit-form/lookups/sites`),
  unitFormDepartments: (params: Record<string, unknown> = {}) => get<Array<Record<string, unknown>>>(`${base}/unit-form/lookups/departments`, params),
  unitFormAreas: (params: Record<string, unknown> = {}) => get<Array<Record<string, unknown>>>(`${base}/unit-form/lookups/areas`, params),
  unitFormUsers: (params: Record<string, unknown> = {}) => get<Array<Record<string, unknown>>>(`${base}/unit-form/lookups/users`, params),
  unitFormEquipment: (params: Record<string, unknown> = {}) => get<Array<Record<string, unknown>>>(`${base}/unit-form/lookups/equipment`, params),
  equipmentLinks: (unitId: string) => get<Array<Record<string, unknown>>>(`${base}/units/${unitId}/equipment-links`),
  linkEquipment: (unitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/units/${unitId}/equipment-links`, input),
  updateEquipmentLink: (unitId: string, linkId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/units/${unitId}/equipment-links/${linkId}`, input),
  unlinkEquipment: (unitId: string, linkId: string, input: Record<string, unknown> = {}) => remove<Record<string, unknown>>(`${base}/units/${unitId}/equipment-links/${linkId}`, input),
  documentLookup: (search = '') => get<Array<Record<string, unknown>>>(`${base}/lookups/documents`, { search }),
  submitReview: (unitId: string, input: Record<string, unknown> = {}) => post<Record<string, unknown>>(`${base}/units/${unitId}/submit-review`, input)
};
