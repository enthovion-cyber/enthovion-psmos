import { api } from '@/services/api';
import type { MiCalibrationRecordRegistryResponse } from '../types/calibration.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const calibrationRecordService = {
  registry(params: Record<string, unknown> = {}, equipmentId?: string): Promise<MiCalibrationRecordRegistryResponse> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/calibration-records` : '/mechanical-integrity/calibration/records';
    return api.get(url, { params }).then(unwrap<MiCalibrationRecordRegistryResponse>);
  },
  get(recordId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/calibration/records/${recordId}`).then(unwrap<Record<string, unknown>>);
  },
  create(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.post('/mechanical-integrity/calibration/records', input).then(unwrap<Record<string, unknown>>);
  },
  update(recordId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.patch(`/mechanical-integrity/calibration/records/${recordId}`, input).then(unwrap<Record<string, unknown>>);
  },
  evaluate(recordId: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/calibration/records/${recordId}/evaluate`, {}).then(unwrap<Record<string, unknown>>);
  },
  submit(recordId: string, comment?: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/calibration/records/${recordId}/submit`, { comment }).then(unwrap<Record<string, unknown>>);
  },
  approve(recordId: string, comment?: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/calibration/records/${recordId}/approve`, { comment }).then(unwrap<Record<string, unknown>>);
  }
};

