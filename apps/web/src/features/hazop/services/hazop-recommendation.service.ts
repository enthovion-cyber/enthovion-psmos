import { api } from '@/services/api';
import { hazopRecommendationEvidenceSchema, hazopRecommendationSchema, hazopRecommendationVerificationSchema, hazopRecommendationDeferralSchema } from '../schemas/hazop-recommendation.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

function clean(params?: Record<string, any>) {
  return Object.fromEntries(Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== '' && value !== 'All'));
}

export const hazopRecommendationService = {
  context: (studyId: string) => api.get(`/hazop/${studyId}/recommendations/context`).then(unwrap<any>),
  summary: (studyId: string) => api.get(`/hazop/${studyId}/recommendations/summary`).then(unwrap<any>),
  register: (studyId: string, params?: Record<string, any>) => api.get(`/hazop/${studyId}/recommendations/register`, { params: clean(params) }).then(unwrap<any>),
  overdue: (studyId: string) => api.get(`/hazop/${studyId}/recommendations/overdue`).then(unwrap<any[]>),
  closureBlockers: (studyId: string) => api.get(`/hazop/${studyId}/recommendations/closure-blockers`).then(unwrap<any[]>),
  detail: (studyId: string, recommendationId: string) => api.get(`/hazop/${studyId}/recommendations/${recommendationId}`).then(unwrap<any>),
  create: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/recommendations`, hazopRecommendationSchema.parse(values)).then(unwrap<any>),
  update: (studyId: string, recommendationId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/recommendations/${recommendationId}`, hazopRecommendationSchema.partial().parse(values)).then(unwrap<any>),
  delete: (studyId: string, recommendationId: string) => api.delete(`/hazop/${studyId}/recommendations/${recommendationId}`).then(unwrap<any>),
  cancel: (studyId: string, recommendationId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/cancel`, values).then(unwrap<any>),
  defer: (studyId: string, recommendationId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/defer`, hazopRecommendationDeferralSchema.parse(values)).then(unwrap<any>),
  requestVerification: (studyId: string, recommendationId: string) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/request-verification`).then(unwrap<any>),
  verify: (studyId: string, recommendationId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/verify`, hazopRecommendationVerificationSchema.parse(values)).then(unwrap<any>),
  rejectVerification: (studyId: string, recommendationId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/reject-verification`, values).then(unwrap<any>),
  evidence: (studyId: string, recommendationId: string) => api.get(`/hazop/${studyId}/recommendations/${recommendationId}/evidence`).then(unwrap<any[]>),
  addEvidence: (studyId: string, recommendationId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/recommendations/${recommendationId}/evidence`, hazopRecommendationEvidenceSchema.parse(values)).then(unwrap<any>),
  deleteEvidence: (studyId: string, recommendationId: string, evidenceId: string) => api.delete(`/hazop/${studyId}/recommendations/${recommendationId}/evidence/${evidenceId}`).then(unwrap<any>),
  export: (studyId: string) => api.post(`/hazop/${studyId}/recommendations/export`).then(unwrap<any>)
};
