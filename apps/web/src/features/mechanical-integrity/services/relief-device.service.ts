import { api } from '@/services/api';
import type { ReliefDeviceDetailResponse, ReliefDeviceRegistryResponse } from '../types/relief-device.types';

function unwrap<T>(response: any): T {
  return response.data.data as T;
}

export const reliefDeviceService = {
  dashboard(params: Record<string, unknown> = {}): Promise<ReliefDeviceRegistryResponse & Record<string, unknown>> {
    return api.get('/mechanical-integrity/relief-devices', { params }).then((response) => unwrap<ReliefDeviceRegistryResponse & Record<string, unknown>>(response));
  },
  registry(params: Record<string, unknown> = {}, equipmentId?: string): Promise<ReliefDeviceRegistryResponse> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/relief-devices` : '/mechanical-integrity/relief-devices';
    return api.get(url, { params }).then((response) => unwrap<ReliefDeviceRegistryResponse>(response));
  },
  summary(params: Record<string, unknown> = {}): Promise<{ summary: Record<string, unknown> }> {
    return api.get('/mechanical-integrity/relief-devices/summary', { params }).then((response) => unwrap<{ summary: Record<string, unknown> }>(response));
  },
  due(params: Record<string, unknown> = {}): Promise<ReliefDeviceRegistryResponse> {
    return api.get('/mechanical-integrity/relief-devices/due', { params }).then((response) => unwrap<ReliefDeviceRegistryResponse>(response));
  },
  overdue(params: Record<string, unknown> = {}): Promise<ReliefDeviceRegistryResponse> {
    return api.get('/mechanical-integrity/relief-devices/overdue', { params }).then((response) => unwrap<ReliefDeviceRegistryResponse>(response));
  },
  failed(params: Record<string, unknown> = {}): Promise<ReliefDeviceRegistryResponse> {
    return api.get('/mechanical-integrity/relief-devices/failed', { params }).then((response) => unwrap<ReliefDeviceRegistryResponse>(response));
  },
  get(reliefDeviceId: string): Promise<ReliefDeviceDetailResponse> {
    return api.get(`/mechanical-integrity/relief-devices/${reliefDeviceId}`).then((response) => unwrap<ReliefDeviceDetailResponse>(response));
  },
  create(input: Record<string, unknown>, equipmentId?: string): Promise<ReliefDeviceDetailResponse> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/relief-devices` : '/mechanical-integrity/relief-devices';
    return api.post(url, input).then((response) => unwrap<ReliefDeviceDetailResponse>(response));
  },
  update(reliefDeviceId: string, input: Record<string, unknown>): Promise<ReliefDeviceDetailResponse> {
    return api.patch(`/mechanical-integrity/relief-devices/${reliefDeviceId}`, input).then((response) => unwrap<ReliefDeviceDetailResponse>(response));
  },
  archive(reliefDeviceId: string, reason: string): Promise<ReliefDeviceDetailResponse> {
    return api.post(`/mechanical-integrity/relief-devices/${reliefDeviceId}/archive`, { reason }).then((response) => unwrap<ReliefDeviceDetailResponse>(response));
  },
  reactivate(reliefDeviceId: string, reason: string): Promise<ReliefDeviceDetailResponse> {
    return api.post(`/mechanical-integrity/relief-devices/${reliefDeviceId}/reactivate`, { reason }).then((response) => unwrap<ReliefDeviceDetailResponse>(response));
  },
  updateTechnicalData(reliefDeviceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.patch(`/mechanical-integrity/relief-devices/${reliefDeviceId}/technical-data`, input).then((response) => unwrap<Record<string, unknown>>(response));
  },
  updateBasis(reliefDeviceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.patch(`/mechanical-integrity/relief-devices/${reliefDeviceId}/relief-basis`, input).then((response) => unwrap<Record<string, unknown>>(response));
  },
  linkProtectedEquipment(reliefDeviceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/relief-devices/${reliefDeviceId}/protected-equipment`, input).then((response) => unwrap<Record<string, unknown>>(response));
  },
  updateSeals(reliefDeviceId: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.patch(`/mechanical-integrity/relief-devices/${reliefDeviceId}/seals`, input).then((response) => unwrap<Record<string, unknown>>(response));
  },
  runScheduler(): Promise<Record<string, unknown>> {
    return api.post('/mechanical-integrity/relief-devices/scheduler/run', {}).then((response) => unwrap<Record<string, unknown>>(response));
  },
  equipmentProtectionSummary(equipmentId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/relief-protection-summary`).then((response) => unwrap<Record<string, unknown>>(response));
  }
};
