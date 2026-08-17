import { get, patch, post, remove } from './psi-api';
import type { ReliefSystemDetail, ReliefSystemLookups, ReliefSystemRegistry, ReliefSystemSummary } from '../types/relief-system.types';

const base = '/process-safety-information';

export const reliefSystemService = {
  registry: (params: Record<string, unknown> = {}) => get<ReliefSystemRegistry>(`${base}/relief-systems`, params),
  unitRegistry: (unitId: string, params: Record<string, unknown> = {}) => get<ReliefSystemRegistry>(`${base}/units/${unitId}/relief-systems`, params),
  equipmentRegistry: (equipmentId: string, params: Record<string, unknown> = {}) => get<ReliefSystemRegistry>(`${base}/equipment/${equipmentId}/relief-systems`, params),
  summary: (params: Record<string, unknown> = {}) => get<ReliefSystemSummary>(`${base}/relief-systems/summary`, params),
  detail: (reliefBasisId: string) => get<ReliefSystemDetail>(`${base}/relief-systems/${reliefBasisId}`),
  create: (input: Record<string, unknown>) => post<ReliefSystemDetail>(`${base}/relief-systems`, input),
  createForUnit: (unitId: string, input: Record<string, unknown>) => post<ReliefSystemDetail>(`${base}/units/${unitId}/relief-systems`, input),
  update: (reliefBasisId: string, input: Record<string, unknown>) => patch<ReliefSystemDetail>(`${base}/relief-systems/${reliefBasisId}`, input),
  archive: (reliefBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/relief-systems/${reliefBasisId}/archive`, input),
  reactivate: (reliefBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/relief-systems/${reliefBasisId}/reactivate`, input),
  clone: (reliefBasisId: string, input: Record<string, unknown>) => post<ReliefSystemDetail>(`${base}/relief-systems/${reliefBasisId}/clone`, input),
  upsertProtectedEquipment: (reliefBasisId: string, input: Record<string, unknown>) => patch<Record<string, unknown>[]>(`${base}/relief-systems/${reliefBasisId}/protected-equipment`, input),
  linkDevice: (reliefBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/relief-systems/${reliefBasisId}/devices/link`, input),
  updateDevice: (reliefBasisId: string, deviceLinkId: string, input: Record<string, unknown>) => patch<Record<string, unknown>[]>(`${base}/relief-systems/${reliefBasisId}/devices/${deviceLinkId}`, input),
  removeDevice: (reliefBasisId: string, deviceLinkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>[]>(`${base}/relief-systems/${reliefBasisId}/devices/${deviceLinkId}`, input),
  upsertSizing: (reliefBasisId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/relief-systems/${reliefBasisId}/sizing-basis`, input),
  upsertDischarge: (reliefBasisId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/relief-systems/${reliefBasisId}/discharge-destination`, input),
  linkDocument: (reliefBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/relief-systems/${reliefBasisId}/documents/link`, input),
  unlinkDocument: (reliefBasisId: string, documentLinkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>[]>(`${base}/relief-systems/${reliefBasisId}/documents/${documentLinkId}`, input),
  importTemplate: () => get<Record<string, unknown>>(`${base}/relief-systems/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/relief-systems/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${base}/relief-systems/export`, params),
  submitReview: (reliefBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/relief-systems/${reliefBasisId}/submit-review`, input),
  lookups: async (): Promise<ReliefSystemLookups> => ({
    reliefSystemTypes: await get<string[]>(`${base}/lookups/relief-system-types`),
    reliefDeviceTypes: await get<string[]>(`${base}/lookups/relief-device-types`),
    reliefScenarioTypes: await get<string[]>(`${base}/lookups/relief-scenario-types`),
    reliefDestinationTypes: await get<string[]>(`${base}/lookups/relief-destination-types`),
    calculationStatuses: await get<string[]>(`${base}/lookups/calculation-statuses`),
    conflictStatuses: await get<string[]>(`${base}/lookups/relief-conflict-statuses`),
    documentTypes: await get<string[]>(`${base}/lookups/relief-document-types`)
  })
};
