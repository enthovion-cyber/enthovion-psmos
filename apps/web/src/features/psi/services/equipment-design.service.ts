import { get, patch, post, remove } from './psi-api';
import type { EquipmentDesignDetail, EquipmentDesignLookups, EquipmentDesignRegistry, EquipmentDesignSummary } from '../types/equipment-design.types';

const base = '/process-safety-information';

export const equipmentDesignService = {
  registry: (params: Record<string, unknown> = {}) => get<EquipmentDesignRegistry>(`${base}/equipment-design`, params),
  unitRegistry: (unitId: string, params: Record<string, unknown> = {}) => get<EquipmentDesignRegistry>(`${base}/units/${unitId}/equipment-design`, params),
  equipmentRegistry: (equipmentId: string, params: Record<string, unknown> = {}) => get<EquipmentDesignRegistry>(`${base}/equipment/${equipmentId}/design-basis`, params),
  summary: (params: Record<string, unknown> = {}) => get<EquipmentDesignSummary>(`${base}/equipment-design/summary`, params),
  detail: (designBasisId: string) => get<EquipmentDesignDetail>(`${base}/equipment-design/${designBasisId}`),
  create: (input: Record<string, unknown>) => post<EquipmentDesignDetail>(`${base}/equipment-design`, input),
  createForUnit: (unitId: string, input: Record<string, unknown>) => post<EquipmentDesignDetail>(`${base}/units/${unitId}/equipment-design`, input),
  update: (designBasisId: string, input: Record<string, unknown>) => patch<EquipmentDesignDetail>(`${base}/equipment-design/${designBasisId}`, input),
  archive: (designBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/equipment-design/${designBasisId}/archive`, input),
  reactivate: (designBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/equipment-design/${designBasisId}/reactivate`, input),
  clone: (designBasisId: string, input: Record<string, unknown>) => post<EquipmentDesignDetail>(`${base}/equipment-design/${designBasisId}/clone`, input),
  updateSection: (designBasisId: string, section: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/equipment-design/${designBasisId}/${section}`, input),
  runCompleteness: (designBasisId: string) => post<Record<string, unknown>[]>(`${base}/equipment-design/${designBasisId}/completeness/run`),
  runConflictCheck: (designBasisId: string) => post<Record<string, unknown>[]>(`${base}/equipment-design/${designBasisId}/conflict-check/run`),
  overrideConflict: (designBasisId: string, conflictId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/equipment-design/${designBasisId}/conflicts/${conflictId}/override`, input),
  miDiff: (designBasisId: string) => get<Record<string, unknown>>(`${base}/equipment-design/${designBasisId}/sync/mi-diff`),
  syncFromMi: (designBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/equipment-design/${designBasisId}/sync/from-mi`, input),
  syncToMi: (designBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/equipment-design/${designBasisId}/sync/to-mi`, input),
  compareOnly: (designBasisId: string) => post<Record<string, unknown>>(`${base}/equipment-design/${designBasisId}/sync/compare-only`),
  submitReview: (designBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/equipment-design/${designBasisId}/submit-review`, input),
  linkDocument: (designBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/equipment-design/${designBasisId}/documents/link`, input),
  unlinkDocument: (designBasisId: string, documentLinkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>[]>(`${base}/equipment-design/${designBasisId}/documents/${documentLinkId}`, input),
  importTemplate: () => get<Record<string, unknown>>(`${base}/equipment-design/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/equipment-design/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${base}/equipment-design/export`, params),
  lookups: async (): Promise<EquipmentDesignLookups> => ({
    equipmentTypes: await get<string[]>(`${base}/lookups/equipment-types`),
    equipmentCategories: await get<string[]>(`${base}/lookups/equipment-categories`),
    designCodes: await get<string[]>(`${base}/lookups/design-codes`),
    fluidPhases: await get<string[]>(`${base}/lookups/fluid-phases`),
    materials: await get<string[]>(`${base}/lookups/materials`),
    equipmentCriticalities: await get<string[]>(`${base}/lookups/equipment-criticalities`),
    conflictStatuses: await get<string[]>(`${base}/lookups/design-basis-conflict-statuses`),
    documentTypes: await get<string[]>(`${base}/lookups/design-basis-document-types`)
  })
};
