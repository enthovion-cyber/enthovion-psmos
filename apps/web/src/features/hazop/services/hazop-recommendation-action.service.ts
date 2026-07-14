import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopRecommendationActionService = {
  createAction: (studyId: string, recommendationId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/create-action`, values ?? {}).then(unwrap<any>),
  linkAction: (studyId: string, recommendationId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/link-action`, values).then(unwrap<any>),
  unlinkAction: (studyId: string, recommendationId: string) => api.delete(`/hazop/${studyId}/recommendations/${recommendationId}/link-action`).then(unwrap<any>),
  syncAction: (studyId: string, recommendationId: string) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/sync-action`).then(unwrap<any>)
};
