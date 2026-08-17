import { api } from '@/services/api';
import type { MiCalibrationRegistryResponse } from '../types/calibration.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const calibrationPlanService = {
  dashboard(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return api.get('/mechanical-integrity/calibration', { params }).then(unwrap<Record<string, unknown>>);
  },
  registry(params: Record<string, unknown> = {}, equipmentId?: string): Promise<MiCalibrationRegistryResponse> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/calibration` : '/mechanical-integrity/calibration/plans';
    return api.get(url, { params }).then(unwrap<MiCalibrationRegistryResponse>);
  },
  due(params: Record<string, unknown> = {}): Promise<MiCalibrationRegistryResponse> {
    return api.get('/mechanical-integrity/calibration/due', { params }).then(unwrap<MiCalibrationRegistryResponse>);
  },
  overdue(params: Record<string, unknown> = {}): Promise<MiCalibrationRegistryResponse> {
    return api.get('/mechanical-integrity/calibration/overdue', { params }).then(unwrap<MiCalibrationRegistryResponse>);
  },
  failed(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return api.get('/mechanical-integrity/calibration/failed', { params }).then(unwrap<Record<string, unknown>>);
  },
  get(planId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/calibration/plans/${planId}`).then(unwrap<Record<string, unknown>>);
  },
  create(input: Record<string, unknown>, equipmentId?: string): Promise<Record<string, unknown>> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/calibration` : '/mechanical-integrity/calibration/plans';
    return api.post(url, input).then(unwrap<Record<string, unknown>>);
  },
  update(planId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.patch(`/mechanical-integrity/calibration/plans/${planId}`, input).then(unwrap<Record<string, unknown>>);
  },
  submit(planId: string, comment?: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/calibration/plans/${planId}/submit`, { comment }).then(unwrap<Record<string, unknown>>);
  },
  approve(planId: string, comment?: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/calibration/plans/${planId}/approve`, { comment }).then(unwrap<Record<string, unknown>>);
  },
  reject(planId: string, reason: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/calibration/plans/${planId}/reject`, { reason }).then(unwrap<Record<string, unknown>>);
  },
  runScheduler(): Promise<Record<string, unknown>> {
    return api.post('/mechanical-integrity/calibration/scheduler/run', {}).then(unwrap<Record<string, unknown>>);
  }
};

