import { api } from '@/services/api';
import type { HazopLinkedRecordFilters } from '../types/hazop-linked-record.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopLinkedRecordService = {
  summary: (studyId: string) => api.get(`/hazop/${studyId}/linked-records/summary`).then(unwrap<any>),
  context: (studyId: string) => api.get(`/hazop/${studyId}/linked-records/context`).then(unwrap<any>),
  list: (studyId: string, params?: HazopLinkedRecordFilters) => api.get(`/hazop/${studyId}/linked-records`, { params }).then(unwrap<any[]>),
  detail: (studyId: string, linkId: string) => api.get(`/hazop/${studyId}/linked-records/${linkId}`).then(unwrap<any>),
  blockers: (studyId: string) => api.get(`/hazop/${studyId}/linked-records/blockers`).then(unwrap<any[]>),
  search: (studyId: string, params: Record<string, any>) => api.get(`/hazop/${studyId}/linked-records/search`, { params }).then(unwrap<any[]>),
  create: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/linked-records`, values).then(unwrap<any>),
  update: (studyId: string, linkId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/linked-records/${linkId}`, values).then(unwrap<any>),
  delete: (studyId: string, linkId: string, reason?: string) => api.delete(`/hazop/${studyId}/linked-records/${linkId}`, { data: { reason } }).then(unwrap<any>),
  sync: (studyId: string, linkId: string) => api.post(`/hazop/${studyId}/linked-records/${linkId}/sync`).then(unwrap<any>),
  markBlocking: (studyId: string, linkId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/linked-records/${linkId}/mark-blocking`, values).then(unwrap<any>),
  resolveBlocker: (studyId: string, linkId: string, blockerId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/linked-records/${linkId}/resolve-blocker`, { ...values, blockerId }).then(unwrap<any>),
  export: (studyId: string) => api.post(`/hazop/${studyId}/linked-records/export`).then(unwrap<any>)
};
