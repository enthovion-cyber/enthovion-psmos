import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopReviewService = {
  readiness: (studyId: string) => api.get(`/hazop/${studyId}/review/readiness`).then(unwrap<any>),
  recalculate: (studyId: string) => api.post(`/hazop/${studyId}/review/readiness/recalculate`).then(unwrap<any>),
  blockers: (studyId: string) => api.get(`/hazop/${studyId}/review/blockers`).then(unwrap<any[]>),
  workflow: (studyId: string) => api.get(`/hazop/${studyId}/review/workflow`).then(unwrap<any>),
  start: (studyId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/review/start`, values ?? {}).then(unwrap<any>),
  requestApproval: (studyId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/review/request-approval`, values ?? {}).then(unwrap<any>),
  approve: (studyId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/review/approve`, values ?? {}).then(unwrap<any>),
  reject: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/review/reject`, values).then(unwrap<any>),
  returnForRework: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/review/return-for-rework`, values).then(unwrap<any>),
  close: (studyId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/review/close`, values ?? {}).then(unwrap<any>),
  reopen: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/review/reopen`, values).then(unwrap<any>),
  comments: (studyId: string) => api.get(`/hazop/${studyId}/review/comments`).then(unwrap<any[]>),
  addComment: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/review/comments`, values).then(unwrap<any>),
  updateComment: (studyId: string, commentId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/review/comments/${commentId}`, values).then(unwrap<any>),
  resolveComment: (studyId: string, commentId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/review/comments/${commentId}/resolve`, values).then(unwrap<any>),
  createCommentAction: (studyId: string, commentId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/review/comments/${commentId}/create-action`, values).then(unwrap<any>),
  exportPackage: (studyId: string) => api.post(`/hazop/${studyId}/review/export-package`).then(unwrap<any>)
};
