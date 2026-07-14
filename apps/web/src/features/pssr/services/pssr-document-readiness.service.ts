import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrDocumentReadinessService = {
  get: (pssrId: string) => api.get(`/pssr/${pssrId}/document-readiness`).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/document-readiness/summary`).then(unwrap<any>),
  requirements: (pssrId: string) => api.get(`/pssr/${pssrId}/document-readiness/requirements`).then(unwrap<any[]>),
  generate: (pssrId: string) => api.post(`/pssr/${pssrId}/document-readiness/generate`).then(unwrap<any>),
  linkDocument: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/document-readiness/link-document`, values).then(unwrap<any>),
  unlinkDocument: (pssrId: string, readinessId: string) => api.delete(`/pssr/${pssrId}/document-readiness/unlink-document/${readinessId}`).then(unwrap<any>),
  requestRevision: (pssrId: string, readinessId: string, reason: string) => api.post(`/pssr/${pssrId}/document-readiness/${readinessId}/request-revision`, { reason }).then(unwrap<any>),
  justifyNotRequired: (pssrId: string, readinessId: string, justification: string) => api.post(`/pssr/${pssrId}/document-readiness/${readinessId}/justify-not-required`, { justification }).then(unwrap<any>),
  verify: (pssrId: string, readinessId: string, comment: string) => api.post(`/pssr/${pssrId}/document-readiness/${readinessId}/verify`, { comment }).then(unwrap<any>),
  reject: (pssrId: string, readinessId: string, reason: string) => api.post(`/pssr/${pssrId}/document-readiness/${readinessId}/reject`, { reason }).then(unwrap<any>),
  blockers: (pssrId: string) => api.get(`/pssr/${pssrId}/document-readiness/blockers`).then(unwrap<any[]>),
  syncFromMoc: (pssrId: string) => api.post(`/pssr/${pssrId}/document-readiness/sync-from-moc`).then(unwrap<any>)
};
