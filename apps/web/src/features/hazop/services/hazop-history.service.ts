import { api } from '@/services/api';
import type { HazopHistoryFilters } from '../types/hazop-history.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopHistoryService = {
  summary: (studyId: string) => api.get(`/hazop/${studyId}/history/summary`).then(unwrap<any>),
  list: (studyId: string, params?: HazopHistoryFilters) => api.get(`/hazop/${studyId}/history`, { params }).then(unwrap<any[]>),
  detail: (studyId: string, eventId: string) => api.get(`/hazop/${studyId}/history/${eventId}`).then(unwrap<any>),
  safetyCritical: (studyId: string) => api.get(`/hazop/${studyId}/history/safety-critical`).then(unwrap<any[]>),
  export: (studyId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/history/export`, values ?? {}).then(unwrap<any>)
};
