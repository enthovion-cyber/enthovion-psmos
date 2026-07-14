import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocTemporaryEmergencyService = {
  temporary: (id: string) => api.get(`/moc/${id}/temporary-control`).then(unwrap<any>),
  updateTemporary: (id: string, values: Record<string, any>) => api.patch(`/moc/${id}/temporary-control`, values).then(unwrap<any>),
  requestExtension: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/temporary-control/request-extension`, values).then(unwrap<any>),
  approveExtension: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/temporary-control/approve-extension`, values).then(unwrap<any>),
  rejectExtension: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/temporary-control/reject-extension`, values).then(unwrap<any>),
  markRemovalComplete: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/temporary-control/mark-removal-complete`, values).then(unwrap<any>),
  convertTemporaryToPermanent: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/temporary-control/convert-to-permanent`, values).then(unwrap<any>),
  extensions: (id: string) => api.get(`/moc/${id}/temporary-control/extensions`).then(unwrap<any[]>),
  emergency: (id: string) => api.get(`/moc/${id}/emergency-control`).then(unwrap<any>),
  updateEmergency: (id: string, values: Record<string, any>) => api.patch(`/moc/${id}/emergency-control`, values).then(unwrap<any>),
  completeEmergencyReview: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/emergency-control/complete-review`, values).then(unwrap<any>),
  createEmergencyFollowupAction: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/emergency-control/create-follow-up-action`, values).then(unwrap<any>),
  convertEmergencyToPermanent: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/emergency-control/convert-to-permanent`, values).then(unwrap<any>)
};
