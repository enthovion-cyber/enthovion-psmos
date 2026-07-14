import { api } from '@/services/api';
import type { HazopOverviewData } from '../types/hazop-overview.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopOverviewService = {
  get: (id: string) => api.get(`/hazop/${id}/overview`).then(unwrap<HazopOverviewData>),
  kpis: (id: string) => api.get(`/hazop/${id}/overview/kpis`).then(unwrap<any>),
  progress: (id: string) => api.get(`/hazop/${id}/overview/progress`).then(unwrap<any>),
  riskSnapshot: (id: string) => api.get(`/hazop/${id}/overview/risk-snapshot`).then(unwrap<any>),
  readiness: (id: string) => api.get(`/hazop/${id}/overview/readiness`).then(unwrap<any>),
  export: (id: string) => api.post(`/hazop/${id}/overview/export`).then(unwrap<any>)
};
