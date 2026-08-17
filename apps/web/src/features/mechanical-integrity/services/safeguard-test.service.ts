import type { SafeguardTestDetailResponse, SafeguardTestRegistryResponse } from '../types/safeguard-test.types';
import { get, patch, post, remove } from './safeguard-api';

export const safeguardTestService = {
  registry: (params: Record<string, unknown> = {}, equipmentId?: string) => get<SafeguardTestRegistryResponse>(equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/safeguard-tests` : '/mechanical-integrity/safeguard-tests', params),
  get: (testId: string) => get<SafeguardTestDetailResponse>(`/mechanical-integrity/safeguard-tests/${testId}`),
  create: (input: Record<string, unknown>) => post<SafeguardTestDetailResponse>('/mechanical-integrity/safeguard-tests', input),
  update: (testId: string, input: Record<string, unknown>) => patch<SafeguardTestDetailResponse>(`/mechanical-integrity/safeguard-tests/${testId}`, input),
  steps: (testId: string) => get<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/steps`),
  addStep: (testId: string, input: Record<string, unknown>) => post<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/steps`, input),
  updateStep: (testId: string, stepId: string, input: Record<string, unknown>) => patch<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/steps/${stepId}`, input),
  removeStep: (testId: string, stepId: string) => remove<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/steps/${stepId}`),
  evaluate: (testId: string) => post<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/evaluate`, {}),
  submit: (testId: string, input: Record<string, unknown>) => post<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/submit`, input),
  approve: (testId: string, input: Record<string, unknown>) => post<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/approve`, input),
  reject: (testId: string, input: Record<string, unknown>) => post<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/reject`, input),
  returnForCorrection: (testId: string, input: Record<string, unknown>) => post<Record<string, any>>(`/mechanical-integrity/safeguard-tests/${testId}/return`, input),
  importTemplate: () => get<Record<string, any>>('/mechanical-integrity/safeguard-tests/import-template'),
  importRows: (input: Record<string, unknown>) => post<Record<string, any>>('/mechanical-integrity/safeguard-tests/import', input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/safeguard-tests/export', params)
};
