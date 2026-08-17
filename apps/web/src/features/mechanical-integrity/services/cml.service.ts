import { api } from '@/services/api';
import type { MiCml, MiCmlCalculation, MiCmlReading, MiCmlRegistryResponse } from '../types/cml.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const miCmlService = {
  registry(equipmentId: string, params: Record<string, unknown> = {}): Promise<MiCmlRegistryResponse> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls`, { params }).then(unwrap<MiCmlRegistryResponse>);
  },
  summary(equipmentId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls/summary`).then(unwrap<Record<string, unknown>>);
  },
  alerts(equipmentId: string): Promise<Array<Record<string, unknown>>> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls/alerts`).then(unwrap<Array<Record<string, unknown>>>);
  },
  get(equipmentId: string, cmlId: string): Promise<MiCml> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}`).then(unwrap<MiCml>);
  },
  create(equipmentId: string, input: Record<string, unknown>): Promise<MiCml> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls`, input).then(unwrap<MiCml>);
  },
  update(equipmentId: string, cmlId: string, input: Record<string, unknown>): Promise<MiCml> {
    return api.patch(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}`, input).then(unwrap<MiCml>);
  },
  archive(equipmentId: string, cmlId: string, reason: string): Promise<MiCml> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/archive`, { reason }).then(unwrap<MiCml>);
  },
  reactivate(equipmentId: string, cmlId: string, reason: string): Promise<MiCml> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/reactivate`, { reason }).then(unwrap<MiCml>);
  },
  readings(equipmentId: string, cmlId: string): Promise<MiCmlReading[]> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/readings`).then(unwrap<MiCmlReading[]>);
  },
  addReading(equipmentId: string, cmlId: string, input: Record<string, unknown>): Promise<MiCmlReading> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/readings`, input).then(unwrap<MiCmlReading>);
  },
  approveReading(equipmentId: string, cmlId: string, readingId: string, comment?: string): Promise<MiCmlReading> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/readings/${readingId}/approve`, { comment }).then(unwrap<MiCmlReading>);
  },
  calculation(equipmentId: string, cmlId: string): Promise<MiCmlCalculation> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/calculation`).then(unwrap<MiCmlCalculation>);
  },
  recalculate(equipmentId: string, cmlId: string): Promise<MiCmlCalculation> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/recalculate`).then(unwrap<MiCmlCalculation>);
  },
  recalculateAll(equipmentId: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/recalculate-all`).then(unwrap<Record<string, unknown>>);
  },
  importRows(equipmentId: string, rows: Array<Record<string, unknown>>): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/import`, { rows }).then(unwrap<Record<string, unknown>>);
  },
  importReadingRows(equipmentId: string, rows: Array<Record<string, unknown>>): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/readings/import`, { rows }).then(unwrap<Record<string, unknown>>);
  },
  getImportJob(equipmentId: string, jobId: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls/import/${jobId}`).then(unwrap<Record<string, unknown>>);
  },
  validateImportJob(equipmentId: string, jobId: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/import/${jobId}/validate`).then(unwrap<Record<string, unknown>>);
  },
  commitImportJob(equipmentId: string, jobId: string): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/import/${jobId}/commit`).then(unwrap<Record<string, unknown>>);
  }
};
