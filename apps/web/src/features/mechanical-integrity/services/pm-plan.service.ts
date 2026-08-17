import { api } from '@/services/api';
import type { MiPmRegistryResponse } from '../types/pm.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pmPlanService = {
  dashboard(params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return api.get('/mechanical-integrity/preventive-maintenance', { params }).then(unwrap<Record<string, unknown>>);
  },
  registry(params: Record<string, unknown> = {}, equipmentId?: string): Promise<MiPmRegistryResponse> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/preventive-maintenance` : '/mechanical-integrity/preventive-maintenance/plans';
    return api.get(url, { params }).then(unwrap<MiPmRegistryResponse>);
  },
  due(params: Record<string, unknown> = {}): Promise<MiPmRegistryResponse> {
    return api.get('/mechanical-integrity/preventive-maintenance/due', { params }).then(unwrap<MiPmRegistryResponse>);
  },
  overdue(params: Record<string, unknown> = {}): Promise<MiPmRegistryResponse> {
    return api.get('/mechanical-integrity/preventive-maintenance/overdue', { params }).then(unwrap<MiPmRegistryResponse>);
  },
  get(planId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/preventive-maintenance/plans/${planId}`).then(unwrap<Record<string, unknown>>);
  },
  create(input: Record<string, unknown>, equipmentId?: string): Promise<Record<string, unknown>> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/preventive-maintenance` : '/mechanical-integrity/preventive-maintenance/plans';
    return api.post(url, input).then(unwrap<Record<string, unknown>>);
  },
  update(planId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.patch(`/mechanical-integrity/preventive-maintenance/plans/${planId}`, input).then(unwrap<Record<string, unknown>>);
  },
  submit(planId: string, comment?: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/preventive-maintenance/plans/${planId}/submit`, { comment }).then(unwrap<Record<string, unknown>>);
  },
  approve(planId: string, comment?: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/preventive-maintenance/plans/${planId}/approve`, { comment }).then(unwrap<Record<string, unknown>>);
  },
  reject(planId: string, reason: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/preventive-maintenance/plans/${planId}/reject`, { reason }).then(unwrap<Record<string, unknown>>);
  },
  createRevision(planId: string, reason: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/preventive-maintenance/plans/${planId}/create-revision`, { reason }).then(unwrap<Record<string, unknown>>);
  },
  archive(planId: string, reason: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/preventive-maintenance/plans/${planId}/archive`, { reason }).then(unwrap<Record<string, unknown>>);
  },
  runScheduler(): Promise<Record<string, unknown>> {
    return api.post('/mechanical-integrity/preventive-maintenance/scheduler/run', {}).then(unwrap<Record<string, unknown>>);
  }
};

