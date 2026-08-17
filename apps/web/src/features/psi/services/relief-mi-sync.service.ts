import { get, post } from './psi-api';

const base = '/process-safety-information/relief-systems';

export const reliefMiSyncService = {
  diff: (reliefBasisId: string) => get<Record<string, unknown>>(`${base}/${reliefBasisId}/sync/mi-diff`),
  fromMi: (reliefBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${reliefBasisId}/sync/from-mi`, input),
  toMi: (reliefBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${reliefBasisId}/sync/to-mi`, input),
  compareOnly: (reliefBasisId: string) => post<Record<string, unknown>>(`${base}/${reliefBasisId}/sync/compare-only`)
};
