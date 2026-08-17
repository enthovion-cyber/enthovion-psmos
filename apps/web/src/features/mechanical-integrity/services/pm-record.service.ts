import { api } from '@/services/api';
import type { MiPmRecordRegistryResponse } from '../types/pm.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pmRecordService = {
  registry(params: Record<string, unknown> = {}, equipmentId?: string): Promise<MiPmRecordRegistryResponse> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/pm-records` : '/mechanical-integrity/preventive-maintenance/records';
    return api.get(url, { params }).then(unwrap<MiPmRecordRegistryResponse>);
  },
  get(recordId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/preventive-maintenance/records/${recordId}`).then(unwrap<Record<string, unknown>>);
  },
  create(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.post('/mechanical-integrity/preventive-maintenance/records', input).then(unwrap<Record<string, unknown>>);
  },
  update(recordId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.patch(`/mechanical-integrity/preventive-maintenance/records/${recordId}`, input).then(unwrap<Record<string, unknown>>);
  },
  submit(recordId: string, comment?: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/preventive-maintenance/records/${recordId}/submit`, { comment }).then(unwrap<Record<string, unknown>>);
  },
  approve(recordId: string, comment?: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/preventive-maintenance/records/${recordId}/approve`, { comment }).then(unwrap<Record<string, unknown>>);
  },
  reject(recordId: string, reason: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/preventive-maintenance/records/${recordId}/reject`, { reason }).then(unwrap<Record<string, unknown>>);
  }
};

