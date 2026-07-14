import { api } from '@/services/api';
import type { LopaLinkedRecordFilters, LopaLinkedRecordInput, LopaLinkedRecordsTabData } from '../types/lopa-linked-record.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaLinkedRecordService = {
  get: (id: string, filters: LopaLinkedRecordFilters = {}) => api.get(`/lopa/${id}/linked-records`, { params: filters }).then(unwrap<LopaLinkedRecordsTabData>),
  create: (id: string, values: LopaLinkedRecordInput) => api.post(`/lopa/${id}/linked-records`, values).then(unwrap<any>),
  update: (id: string, linkId: string, values: LopaLinkedRecordInput) => api.patch(`/lopa/${id}/linked-records/${linkId}`, values).then(unwrap<any>),
  remove: (id: string, linkId: string, reason?: string) => api.delete(`/lopa/${id}/linked-records/${linkId}`, { data: { reason } }).then(unwrap<any>),
  sync: (id: string, linkId: string) => api.post(`/lopa/${id}/linked-records/${linkId}/sync`).then(unwrap<any>),
  syncAll: (id: string) => api.post(`/lopa/${id}/linked-records/sync-all`).then(unwrap<any>),
  compare: (id: string, linkId: string) => api.get(`/lopa/${id}/linked-records/${linkId}/compare`).then(unwrap<any>),
  sources: (id: string, filters: LopaLinkedRecordFilters = {}) => api.get(`/lopa/${id}/linked-records/search-sources`, { params: filters }).then(unwrap<any[]>),
  export: (id: string, filters: LopaLinkedRecordFilters = {}) => api.get(`/lopa/${id}/linked-records/export`, { params: filters }).then(unwrap<any>)
};
