import { get, patch, post, remove } from './psi-api';
import type { PsiChemicalDetail, PsiChemicalLookups, PsiChemicalRegistry } from '../types/psi-chemical.types';

const base = '/process-safety-information';

export const psiChemicalService = {
  registry: (params: Record<string, unknown> = {}) => get<PsiChemicalRegistry>(`${base}/chemicals`, params),
  unitChemicals: (unitId: string, params: Record<string, unknown> = {}) => get<PsiChemicalRegistry>(`${base}/units/${unitId}/chemicals`, params),
  detail: (chemicalId: string) => get<PsiChemicalDetail>(`${base}/chemicals/${chemicalId}`),
  create: (input: Record<string, unknown>) => post<PsiChemicalDetail>(`${base}/chemicals`, input),
  update: (chemicalId: string, input: Record<string, unknown>) => patch<PsiChemicalDetail>(`${base}/chemicals/${chemicalId}`, input),
  archive: (chemicalId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/chemicals/${chemicalId}/archive`, input),
  linkSds: (chemicalId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/chemicals/${chemicalId}/sds/link`, input),
  removeSds: (chemicalId: string, linkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>[]>(`${base}/chemicals/${chemicalId}/sds/${linkId}`, input),
  runSdsCheck: (chemicalId: string) => post<PsiChemicalDetail>(`${base}/chemicals/${chemicalId}/sds/run-check`),
  runCompatibilityCheck: (chemicalId: string, input: Record<string, unknown> = {}) => post<PsiChemicalDetail>(`${base}/chemicals/${chemicalId}/compatibility/run-check`, input),
  patchHazards: (chemicalId: string, input: Record<string, unknown>) => patch<PsiChemicalDetail>(`${base}/chemicals/${chemicalId}/hazards`, input),
  patchExposure: (chemicalId: string, input: Record<string, unknown>) => patch<PsiChemicalDetail>(`${base}/chemicals/${chemicalId}/exposure-health`, input),
  patchCompatibility: (chemicalId: string, input: Record<string, unknown>) => patch<PsiChemicalDetail>(`${base}/chemicals/${chemicalId}/storage-compatibility`, input),
  patchEmergency: (chemicalId: string, input: Record<string, unknown>) => patch<PsiChemicalDetail>(`${base}/chemicals/${chemicalId}/emergency-controls`, input),
  searchChemicalDatabase: (search: string) => get<Record<string, unknown>[]>(`${base}/chemicals/search-chemical-database`, { search }),
  searchSdsLibrary: (search: string) => get<Record<string, unknown>[]>(`${base}/chemicals/search-sds-library`, { search }),
  lookups: async (): Promise<PsiChemicalLookups> => ({
    physicalStates: await get<string[]>(`${base}/lookups/physical-states`),
    chemicalCategories: await get<string[]>(`${base}/lookups/chemical-categories`),
    chemicalUseTypes: await get<string[]>(`${base}/lookups/chemical-use-types`),
    ghsHazardClasses: await get<string[]>(`${base}/lookups/ghs-hazard-classes`),
    sdsStatuses: await get<string[]>(`${base}/lookups/sds-statuses`),
    storageClasses: await get<string[]>(`${base}/lookups/storage-classes`),
    compatibilityRiskLevels: await get<string[]>(`${base}/lookups/compatibility-risk-levels`)
  }),
  importTemplate: () => get<Record<string, unknown>>(`${base}/chemicals/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/chemicals/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${base}/chemicals/export`, params)
};
