import { api } from '@/services/api';
import type { LopaOverview } from '../types/lopa-overview.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaOverviewService = {
  overview: (id: string) => api.get(`/lopa/${id}/overview`).then(unwrap<LopaOverview>),
  readiness: (id: string) => api.get(`/lopa/${id}/readiness`).then(unwrap<LopaOverview['readiness']>),
  blockers: (id: string) => api.get(`/lopa/${id}/blockers`).then(unwrap<LopaOverview['blockers']>),
  recentActivity: (id: string) => api.get(`/lopa/${id}/recent-activity`).then(unwrap<LopaOverview['recentActivity']>)
};
