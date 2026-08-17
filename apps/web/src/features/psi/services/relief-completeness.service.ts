import { get, post } from './psi-api';

const base = '/process-safety-information/relief-systems';

export const reliefCompletenessService = {
  list: (reliefBasisId: string) => get<Record<string, unknown>[]>(`${base}/${reliefBasisId}/completeness`),
  run: (reliefBasisId: string) => post<Record<string, unknown>[]>(`${base}/${reliefBasisId}/completeness/run`)
};
