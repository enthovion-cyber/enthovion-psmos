import { api } from '@/services/api';
import type { IplRegistryContext, IplRegistryFilters, IplRegistryRecord, IplRegistryResponse, IplRegistrySummary, IplRegistryValidationItem } from '../types/lopa-ipl-registry.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

function params(filters?: IplRegistryFilters) {
  return Object.fromEntries(Object.entries(filters ?? {}).filter(([, value]) => value !== '' && value !== undefined));
}

export const lopaIplRegistryService = {
  context: () => api.get('/lopa/ipl-registry/context').then(unwrap<IplRegistryContext>),
  summary: () => api.get('/lopa/ipl-registry/summary').then(unwrap<IplRegistrySummary>),
  list: (filters?: IplRegistryFilters) => api.get('/lopa/ipl-registry', { params: params(filters) }).then(unwrap<IplRegistryResponse>),
  detail: (id: string) => api.get(`/lopa/ipl-registry/${id}`).then(unwrap<IplRegistryRecord>),
  create: (values: Record<string, any>) => api.post('/lopa/ipl-registry', values).then(unwrap<IplRegistryRecord>),
  update: (id: string, values: Record<string, any>) => api.patch(`/lopa/ipl-registry/${id}`, values).then(unwrap<IplRegistryRecord>),
  action: (id: string, action: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive' | 'restore' | 'duplicate', reason?: string) => api.post(`/lopa/ipl-registry/${id}/${action}`, { reason }).then(unwrap<IplRegistryRecord>),
  updateValidation: (id: string, items: IplRegistryValidationItem[]) => api.patch(`/lopa/ipl-registry/${id}/validation`, { items: items.map((item, index) => ({
    criteriaKey: item.criteria_key,
    criteriaLabel: item.criteria_label,
    mandatory: item.mandatory,
    status: item.status,
    evidenceRequired: item.evidence_required,
    evidenceStatus: item.evidence_status,
    notes: item.notes ?? undefined,
    sortOrder: item.sort_order ?? index
  })) }).then(unwrap<IplRegistryValidationItem[]>),
  addEquipmentLink: (id: string, values: Record<string, any>) => api.post(`/lopa/ipl-registry/${id}/equipment-links`, values).then(unwrap<IplRegistryRecord>),
  addDocumentLink: (id: string, values: Record<string, any>) => api.post(`/lopa/ipl-registry/${id}/document-links`, values).then(unwrap<IplRegistryRecord>),
  export: (filters?: IplRegistryFilters) => api.get('/lopa/ipl-registry/export', { params: params(filters) }).then(unwrap<any>)
};
