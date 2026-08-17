import { api } from '@/services/api';
import type { CreateEquipmentInput } from '@/services/equipment.service';
import type { MiEquipment, MiEquipmentBlocker, MiEquipmentHeader, MiEquipmentOverview, MiEquipmentStatusItem, MiEquipmentTechnicalData, MiRegistryResponse } from '../types/equipment.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type MiEquipmentFilters = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  siteId?: string;
  unitId?: string;
  areaId?: string;
  status?: string;
  criticality?: string;
  equipmentType?: string;
  safetyCritical?: string;
};

export const miEquipmentService = {
  registry(filters: MiEquipmentFilters = {}): Promise<MiRegistryResponse> {
    return api.get('/mechanical-integrity/equipment', { params: filters }).then(unwrap<MiRegistryResponse>);
  },
  get(id: string): Promise<MiEquipment> {
    return api.get(`/mechanical-integrity/equipment/${id}`).then(unwrap<MiEquipment>);
  },
  header(id: string): Promise<MiEquipmentHeader> {
    return api.get(`/mechanical-integrity/equipment/${id}/header`).then(unwrap<MiEquipmentHeader>);
  },
  create(input: CreateEquipmentInput): Promise<MiEquipment> {
    return api.post('/mechanical-integrity/equipment', input).then(unwrap<MiEquipment>);
  },
  update(id: string, input: Partial<CreateEquipmentInput>): Promise<MiEquipment> {
    return api.patch(`/mechanical-integrity/equipment/${id}`, input).then(unwrap<MiEquipment>);
  },
  archive(id: string, reason: string): Promise<MiEquipment> {
    return api.post(`/mechanical-integrity/equipment/${id}/archive`, { reason }).then(unwrap<MiEquipment>);
  },
  reactivate(id: string, reason: string): Promise<MiEquipment> {
    return api.post(`/mechanical-integrity/equipment/${id}/reactivate`, { reason }).then(unwrap<MiEquipment>);
  },
  changeStatus(id: string, input: { status: string; reason: string }): Promise<MiEquipment> {
    return api.post(`/mechanical-integrity/equipment/${id}/status-change`, input).then(unwrap<MiEquipment>);
  },
  overview(id: string): Promise<MiEquipmentOverview> {
    return api.get(`/mechanical-integrity/equipment/${id}/overview`).then(unwrap<MiEquipmentOverview>);
  },
  statusSummary(id: string): Promise<MiEquipmentStatusItem[]> {
    return api.get(`/mechanical-integrity/equipment/${id}/status-summary`).then(unwrap<MiEquipmentStatusItem[]>);
  },
  readinessSummary(id: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${id}/readiness-summary`).then(unwrap<Record<string, unknown>>);
  },
  blockers(id: string): Promise<MiEquipmentBlocker[]> {
    return api.get(`/mechanical-integrity/equipment/${id}/blockers`).then(unwrap<MiEquipmentBlocker[]>);
  },
  recentActivity(id: string): Promise<Array<Record<string, unknown>>> {
    return api.get(`/mechanical-integrity/equipment/${id}/recent-activity`).then(unwrap<Array<Record<string, unknown>>>);
  },
  technicalData(id: string): Promise<MiEquipmentTechnicalData> {
    return api.get(`/mechanical-integrity/equipment/${id}/technical-data`).then(unwrap<MiEquipmentTechnicalData>);
  },
  updateTechnicalData(id: string, input: Record<string, unknown>): Promise<MiEquipmentTechnicalData> {
    return api.patch(`/mechanical-integrity/equipment/${id}/technical-data`, input).then(unwrap<MiEquipmentTechnicalData>);
  },
  technicalDataCompleteness(id: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${id}/technical-data/completeness`).then(unwrap<Record<string, unknown>>);
  },
  technicalDataRevisions(id: string): Promise<Array<Record<string, unknown>>> {
    return api.get(`/mechanical-integrity/equipment/${id}/technical-data/revisions`).then(unwrap<Array<Record<string, unknown>>>);
  },
  technicalDataChangeImpact(id: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${id}/technical-data/change-impact`, { params }).then(unwrap<Record<string, unknown>>);
  },
  history(id: string): Promise<Array<Record<string, unknown>>> {
    return api.get(`/mechanical-integrity/equipment/${id}/history`).then(unwrap<Array<Record<string, unknown>>>);
  },
  linkedRecordsSummary(id: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${id}/linked-records/summary`).then(unwrap<Record<string, unknown>>);
  },
  addLinkedRecord(id: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.post(`/mechanical-integrity/equipment/${id}/linked-records`, input).then(unwrap<Record<string, unknown>>);
  },
  removeLinkedRecord(id: string, linkId: string, reason?: string): Promise<Record<string, unknown>> {
    return api.delete(`/mechanical-integrity/equipment/${id}/linked-records/${linkId}`, { data: { reason } }).then(unwrap<Record<string, unknown>>);
  },
  documentsSummary(id: string): Promise<Record<string, unknown>> {
    return api.get(`/mechanical-integrity/equipment/${id}/documents/summary`).then(unwrap<Record<string, unknown>>);
  },
  addDocument(id: string, input: { title: string; documentType: string; documentNo?: string; file?: File }): Promise<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('title', input.title);
    formData.append('documentType', input.documentType);
    if (input.documentNo) formData.append('documentNo', input.documentNo);
    if (input.file) formData.append('file', input.file);
    return api.post(`/mechanical-integrity/equipment/${id}/documents`, formData).then(unwrap<Record<string, unknown>>);
  },
  removeDocument(id: string, documentLinkId: string): Promise<Record<string, unknown>> {
    return api.delete(`/mechanical-integrity/equipment/${id}/documents/${documentLinkId}`).then(unwrap<Record<string, unknown>>);
  },
  lookups(): Promise<Record<string, unknown>> {
    return Promise.all([
      api.get('/mechanical-integrity/lookups/equipment-types').then(unwrap),
      api.get('/mechanical-integrity/lookups/statuses').then(unwrap),
      api.get('/mechanical-integrity/lookups/criticality-categories').then(unwrap),
      api.get('/mechanical-integrity/lookups/fitness-statuses').then(unwrap),
      api.get('/mechanical-integrity/lookups/sites').then(unwrap),
      api.get('/mechanical-integrity/lookups/process-units').then(unwrap),
      api.get('/mechanical-integrity/lookups/areas').then(unwrap)
    ]).then(([equipmentTypes, statuses, criticalityCategories, fitnessStatuses, sites, units, areas]) => ({ equipmentTypes, statuses, criticalityCategories, fitnessStatuses, sites, units, areas }));
  }
};
