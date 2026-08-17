import { get, post } from './psi-api';

const base = '/process-safety-information/relief-systems';

export const reliefConflictService = {
  list: (reliefBasisId: string) => get<Record<string, unknown>[]>(`${base}/${reliefBasisId}/conflicts`),
  run: (reliefBasisId: string) => post<Record<string, unknown>[]>(`${base}/${reliefBasisId}/conflict-check/run`),
  override: (reliefBasisId: string, conflictId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/${reliefBasisId}/conflicts/${conflictId}/override`, input)
};
