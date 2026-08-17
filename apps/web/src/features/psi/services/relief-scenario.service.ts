import { get, patch, post, remove } from './psi-api';

const base = '/process-safety-information/relief-systems';

export const reliefScenarioService = {
  list: (reliefBasisId: string) => get<Record<string, unknown>[]>(`${base}/${reliefBasisId}/scenarios`),
  create: (reliefBasisId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/${reliefBasisId}/scenarios`, input),
  update: (reliefBasisId: string, scenarioId: string, input: Record<string, unknown>) => patch<Record<string, unknown>[]>(`${base}/${reliefBasisId}/scenarios/${scenarioId}`, input),
  remove: (reliefBasisId: string, scenarioId: string, input: Record<string, unknown>) => remove<Record<string, unknown>[]>(`${base}/${reliefBasisId}/scenarios/${scenarioId}`, input),
  markGoverning: (reliefBasisId: string, scenarioId: string, input: Record<string, unknown>) => post<Record<string, unknown>[]>(`${base}/${reliefBasisId}/scenarios/${scenarioId}/mark-governing`, input)
};
