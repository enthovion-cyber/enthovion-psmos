import { get, post, remove } from './psi-api';

const base = '/process-safety-information';

export const psiLinkedRecordService = {
  equipment: (unitId: string) => get<Array<Record<string, unknown>>>(`${base}/units/${unitId}/equipment`),
  linkEquipment: (unitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/units/${unitId}/equipment`, input),
  unlinkEquipment: (unitId: string, linkId: string) => remove<Record<string, unknown>>(`${base}/units/${unitId}/equipment/${linkId}`),
  linkedRecords: (unitId: string) => get<Array<Record<string, unknown>>>(`${base}/units/${unitId}/linked-records`),
  linkRecord: (unitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/units/${unitId}/linked-records`, input),
  unlinkRecord: (unitId: string, linkId: string, input: Record<string, unknown> = {}) => remove<Record<string, unknown>>(`${base}/units/${unitId}/linked-records/${linkId}`, input),
  documents: (unitId: string) => get<Array<Record<string, unknown>>>(`${base}/units/${unitId}/documents`),
  linkDocument: (unitId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/units/${unitId}/documents/link`, input),
  unlinkDocument: (unitId: string, linkId: string, input: Record<string, unknown> = {}) => remove<Record<string, unknown>>(`${base}/units/${unitId}/documents/${linkId}`, input),
  history: (unitId?: string) => get<{ rows: Array<Record<string, unknown>>; summary: Record<string, number> }>(unitId ? `${base}/units/${unitId}/change-history` : `${base}/change-history`)
};
