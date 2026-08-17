import { get, patch, post, remove } from './safeguard-api';
import type { MiLinkedRecord, MiLinkedRecordsResponse } from '../types/linked-record.types';

const base = '/mechanical-integrity/linked-records';

export const miLinkedRecordService = {
  list: (params: Record<string, unknown> = {}) => get<MiLinkedRecordsResponse>(base, params),
  get: (id: string) => get<{ row: MiLinkedRecord; history: Array<Record<string, unknown>> }>(`${base}/${id}`),
  create: (input: Record<string, unknown>) => post<MiLinkedRecord>(base, input),
  update: (id: string, input: Record<string, unknown>) => patch<MiLinkedRecord>(`${base}/${id}`, input),
  remove: (id: string) => remove<MiLinkedRecord>(`${base}/${id}`),
  equipment: (equipmentId: string, params: Record<string, unknown> = {}) => get<MiLinkedRecordsResponse>(`/mechanical-integrity/equipment/${equipmentId}/linked-records`, params),
  searchTargets: (params: Record<string, unknown> = {}) => get<Array<Record<string, unknown>>>(`${base}/search-targets`, params),
  exportUrl: `${base}/export`,
  lookups: () => Promise.all([
    get<string[]>('/mechanical-integrity/lookups/linked-record-types'),
    get<string[]>('/mechanical-integrity/lookups/relationship-types')
  ]).then(([linkedRecordTypes, relationshipTypes]) => ({ linkedRecordTypes, relationshipTypes }))
};
