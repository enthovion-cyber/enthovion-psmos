import { api } from '@/services/api';
import type { ReliefTestDetailResponse, ReliefTestRegistryResponse } from '../types/relief-test.types';

function unwrap<T>(response: any): T {
  return response.data.data as T;
}

export const reliefTestService = {
  registry(params: Record<string, unknown> = {}, equipmentId?: string): Promise<ReliefTestRegistryResponse> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/relief-devices/tests` : '/mechanical-integrity/relief-devices/tests';
    return api.get(url, { params }).then((response) => unwrap<ReliefTestRegistryResponse>(response));
  },
  get(testId: string): Promise<ReliefTestDetailResponse> {
    return api.get(`/mechanical-integrity/relief-devices/tests/${testId}`).then((response) => unwrap<ReliefTestDetailResponse>(response));
  },
  create(input: Record<string, unknown>): Promise<ReliefTestDetailResponse> {
    return api.post('/mechanical-integrity/relief-devices/tests', input).then((response) => unwrap<ReliefTestDetailResponse>(response));
  },
  update(testId: string, input: Record<string, unknown>): Promise<ReliefTestDetailResponse> {
    return api.patch(`/mechanical-integrity/relief-devices/tests/${testId}`, input).then((response) => unwrap<ReliefTestDetailResponse>(response));
  },
  evaluate(testId: string): Promise<ReliefTestDetailResponse> {
    return api.post(`/mechanical-integrity/relief-devices/tests/${testId}/evaluate`, {}).then((response) => unwrap<ReliefTestDetailResponse>(response));
  },
  submit(testId: string, comment?: string): Promise<ReliefTestDetailResponse> {
    return api.post(`/mechanical-integrity/relief-devices/tests/${testId}/submit`, { comment }).then((response) => unwrap<ReliefTestDetailResponse>(response));
  },
  approve(testId: string, comment?: string): Promise<ReliefTestDetailResponse> {
    return api.post(`/mechanical-integrity/relief-devices/tests/${testId}/approve`, { comment }).then((response) => unwrap<ReliefTestDetailResponse>(response));
  },
  reject(testId: string, reason: string): Promise<ReliefTestDetailResponse> {
    return api.post(`/mechanical-integrity/relief-devices/tests/${testId}/reject`, { reason }).then((response) => unwrap<ReliefTestDetailResponse>(response));
  }
};
