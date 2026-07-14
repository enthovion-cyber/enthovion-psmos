import { api } from '@/services/api';
import type { LopaActionInput, LinkExistingLopaActionInput } from '../types/lopa-action.types';
import type { LopaRecommendationFilters, LopaRecommendationInput, LopaRecommendationTabData } from '../types/lopa-recommendation.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaRecommendationService = {
  get: (id: string, filters: LopaRecommendationFilters = {}) => api.get(`/lopa/${id}/recommendations`, { params: filters }).then(unwrap<LopaRecommendationTabData>),
  create: (id: string, values: LopaRecommendationInput) => api.post(`/lopa/${id}/recommendations`, values).then(unwrap<any>),
  update: (id: string, recommendationId: string, values: LopaRecommendationInput) => api.patch(`/lopa/${id}/recommendations/${recommendationId}`, values).then(unwrap<any>),
  remove: (id: string, recommendationId: string, reason?: string) => api.delete(`/lopa/${id}/recommendations/${recommendationId}`, { data: { reason } }).then(unwrap<any>),
  changeStatus: (id: string, recommendationId: string, status: string, reason?: string) => api.post(`/lopa/${id}/recommendations/${recommendationId}/change-status`, { status, reason }).then(unwrap<any>),
  verify: (id: string, recommendationId: string, verificationNotes: string) => api.post(`/lopa/${id}/recommendations/${recommendationId}/verify`, { verificationNotes }).then(unwrap<any>),
  reopen: (id: string, recommendationId: string, reason?: string) => api.post(`/lopa/${id}/recommendations/${recommendationId}/reopen`, { reason }).then(unwrap<any>),
  export: (id: string, filters: LopaRecommendationFilters = {}) => api.get(`/lopa/${id}/recommendations/export`, { params: filters }).then(unwrap<any>),
  createEvidence: (id: string, recommendationId: string, values: Record<string, unknown>) => api.post(`/lopa/${id}/recommendations/${recommendationId}/evidence`, values).then(unwrap<any>),
  createAction: (id: string, values: LopaActionInput) => api.post(`/lopa/${id}/actions/create-from-recommendation`, values).then(unwrap<any>),
  createGapAction: (id: string, values: LopaActionInput) => api.post(`/lopa/${id}/actions/create-from-gap`, values).then(unwrap<any>),
  linkAction: (id: string, values: LinkExistingLopaActionInput) => api.post(`/lopa/${id}/actions/link-existing`, values).then(unwrap<any>),
  unlinkAction: (id: string, actionLinkId: string, reason?: string) => api.delete(`/lopa/${id}/actions/${actionLinkId}/unlink`, { data: { reason } }).then(unwrap<any>),
  syncActions: (id: string) => api.post(`/lopa/${id}/actions/sync`).then(unwrap<any>),
  verifyActionClosure: (id: string, actionId: string, notes?: string) => api.post(`/lopa/${id}/actions/${actionId}/verify-closure`, { notes }).then(unwrap<any>),
  sendReminder: (id: string, reason?: string) => api.post(`/lopa/${id}/actions/send-reminder`, { reason }).then(unwrap<any>),
  escalate: (id: string, reason?: string) => api.post(`/lopa/${id}/actions/escalate`, { reason }).then(unwrap<any>)
};
