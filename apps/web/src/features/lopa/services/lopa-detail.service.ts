import { api } from '@/services/api';
import type { LopaDetailStudy, LopaDetailUpdate } from '../types/lopa-detail.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaDetailService = {
  get: (id: string) => api.get(`/lopa/${id}`).then(unwrap<LopaDetailStudy>),
  update: (id: string, values: LopaDetailUpdate) => api.patch(`/lopa/${id}`, values).then(unwrap<LopaDetailStudy>),
  cancel: (id: string, reason: string) => api.post(`/lopa/${id}/cancel`, { reason }).then(unwrap<LopaDetailStudy>),
  reopen: (id: string, reason: string) => api.post(`/lopa/${id}/reopen`, { reason }).then(unwrap<LopaDetailStudy>),
  syncHazopSource: (id: string) => api.post(`/lopa/${id}/sync-hazop-source`).then(unwrap<any>),
  sourceSnapshot: (id: string) => api.get(`/lopa/${id}/source-snapshot`).then(unwrap<any>)
};
