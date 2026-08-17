import { get, patch, post, remove } from './psi-api';
import type { ElectricalDetail, ElectricalLookups, ElectricalRegistry, ElectricalSummary } from '../types/electrical-classification.types';

const base = '/process-safety-information';
const path = `${base}/electrical-classification`;

export const electricalClassificationService = {
  registry: (params: Record<string, unknown> = {}) => get<ElectricalRegistry>(path, params),
  unitRegistry: (unitId: string, params: Record<string, unknown> = {}) => get<ElectricalRegistry>(`${base}/units/${unitId}/electrical-classification`, params),
  areaRegistry: (areaId: string, params: Record<string, unknown> = {}) => get<ElectricalRegistry>(`${base}/areas/${areaId}/electrical-classification`, params),
  equipmentRegistry: (equipmentId: string, params: Record<string, unknown> = {}) => get<ElectricalRegistry>(`${base}/equipment/${equipmentId}/electrical-classification`, params),
  summary: (params: Record<string, unknown> = {}) => get<ElectricalSummary>(`${path}/summary`, params),
  detail: (classificationId: string) => get<ElectricalDetail>(`${path}/${classificationId}`),
  create: (input: Record<string, unknown>) => post<ElectricalDetail>(path, input),
  createForUnit: (unitId: string, input: Record<string, unknown>) => post<ElectricalDetail>(`${base}/units/${unitId}/electrical-classification`, input),
  update: (classificationId: string, input: Record<string, unknown>) => patch<ElectricalDetail>(`${path}/${classificationId}`, input),
  archive: (classificationId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${classificationId}/archive`, input),
  reactivate: (classificationId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${classificationId}/reactivate`, input),
  clone: (classificationId: string, input: Record<string, unknown>) => post<ElectricalDetail>(`${path}/${classificationId}/clone`, input),
  updateHazardSources: (classificationId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${classificationId}/hazard-sources`, input),
  updateAreaDetails: (classificationId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${classificationId}/area-details`, input),
  updateVentilationBasis: (classificationId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${classificationId}/ventilation-basis`, input),
  updateProtectionRequirements: (classificationId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${classificationId}/protection-requirements`, input),
  addInstalledEquipment: (classificationId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${classificationId}/installed-equipment`, input),
  updateInstalledEquipment: (classificationId: string, itemId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${classificationId}/installed-equipment/${itemId}`, input),
  removeInstalledEquipment: (classificationId: string, itemId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${path}/${classificationId}/installed-equipment/${itemId}`, input),
  runRatingCheck: (classificationId: string) => post<Record<string, unknown>>(`${path}/${classificationId}/rating-check/run`, {}),
  updatePtwControls: (classificationId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${path}/${classificationId}/ptw-controls`, input),
  linkDocument: (classificationId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${classificationId}/documents/link`, input),
  unlinkDocument: (classificationId: string, linkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${path}/${classificationId}/documents/${linkId}`, input),
  runCompleteness: (classificationId: string) => post<Record<string, unknown>>(`${path}/${classificationId}/completeness/run`, {}),
  runConflictCheck: (classificationId: string) => post<Record<string, unknown>>(`${path}/${classificationId}/conflict-check/run`, {}),
  overrideConflict: (classificationId: string, conflictId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${classificationId}/conflicts/${conflictId}/override`, input),
  submitReview: (classificationId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/${classificationId}/submit-review`, input),
  importTemplate: () => get<Record<string, unknown>>(`${path}/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${path}/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${path}/export`, params),
  lookups: async (): Promise<ElectricalLookups> => ({
    classificationSystems: await get<string[]>(`${base}/lookups/classification-systems`),
    hazardousAreaStandards: await get<string[]>(`${base}/lookups/hazardous-area-standards`),
    zones: await get<string[]>(`${base}/lookups/zones`),
    classDivisions: await get<string[]>(`${base}/lookups/class-divisions`),
    gasGroups: await get<string[]>(`${base}/lookups/gas-groups`),
    dustGroups: await get<string[]>(`${base}/lookups/dust-groups`),
    temperatureClasses: await get<string[]>(`${base}/lookups/temperature-classes`),
    protectionMethods: await get<string[]>(`${base}/lookups/protection-methods`),
    releaseSourceTypes: await get<string[]>(`${base}/lookups/release-source-types`),
    releaseGrades: await get<string[]>(`${base}/lookups/release-grades`),
    ventilationTypes: await get<string[]>(`${base}/lookups/ventilation-types`),
    electricalDocumentTypes: await get<string[]>(`${base}/lookups/electrical-classification-document-types`),
    electricalConflictStatuses: await get<string[]>(`${base}/lookups/electrical-conflict-statuses`),
    suitabilityResults: ['Suitable', 'Suitable With Conditions', 'Mismatch', 'Missing Rating Data', 'Not Required', 'Needs Review'],
    materialTypes: ['Flammable gas', 'Flammable vapor', 'Combustible liquid', 'Combustible dust', 'Hybrid mixture', 'Mist/spray', 'Fiber/flyings', 'Other']
  })
};
