import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocStartupService = {
  aggregate: (id: string) => api.get(`/moc/${id}/pssr-startup`).then(unwrap<any>),
  pssr: (id: string) => api.get(`/moc/${id}/pssr`).then(unwrap<any>),
  triggerPssr: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/pssr/trigger`, values).then(unwrap<any>),
  syncPssr: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/pssr/sync`, values).then(unwrap<any>),
  readiness: (id: string) => api.get(`/moc/${id}/startup-readiness`).then(unwrap<any>),
  runCheck: (id: string) => api.post(`/moc/${id}/startup-readiness/check`).then(unwrap<any>),
  blockers: (id: string) => api.get(`/moc/${id}/startup-blockers`).then(unwrap<any[]>),
  createBlockerAction: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/startup-blockers/create-action`, values).then(unwrap<any>),
  readyForStartup: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/ready-for-startup`, values).then(unwrap<any>),
  releaseForStartup: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/release-for-startup`, values).then(unwrap<any>),
  returnToImplementation: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/return-to-implementation`, values).then(unwrap<any>)
};
