import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrStartupAuthorizationService = {
  get: (pssrId: string) => api.get(`/pssr/${pssrId}/startup-authorization`).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/startup-authorization/summary`).then(unwrap<any>),
  readinessCheck: (pssrId: string) => api.post(`/pssr/${pssrId}/startup-authorization/readiness-check`).then(unwrap<any>),
  generateSignatures: (pssrId: string) => api.post(`/pssr/${pssrId}/startup-authorization/generate-signatures`).then(unwrap<any>),
  sign: (pssrId: string, signatureId: string, values: Record<string, any> = {}) => api.post(`/pssr/${pssrId}/startup-authorization/signatures/${signatureId}/sign`, values).then(unwrap<any>),
  reject: (pssrId: string, signatureId: string, reason: string) => api.post(`/pssr/${pssrId}/startup-authorization/signatures/${signatureId}/reject`, { reason }).then(unwrap<any>),
  waive: (pssrId: string, signatureId: string, reason: string) => api.post(`/pssr/${pssrId}/startup-authorization/signatures/${signatureId}/waive`, { reason }).then(unwrap<any>),
  addCondition: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/startup-authorization/conditions`, values).then(unwrap<any>),
  updateCondition: (pssrId: string, conditionId: string, values: Record<string, any>) => api.patch(`/pssr/${pssrId}/startup-authorization/conditions/${conditionId}`, values).then(unwrap<any>),
  deleteCondition: (pssrId: string, conditionId: string) => api.delete(`/pssr/${pssrId}/startup-authorization/conditions/${conditionId}`).then(unwrap<any>),
  returnForCorrection: (pssrId: string, reason: string) => api.post(`/pssr/${pssrId}/startup-authorization/return-for-correction`, { reason }).then(unwrap<any>),
  markReady: (pssrId: string) => api.post(`/pssr/${pssrId}/startup-authorization/mark-ready`).then(unwrap<any>),
  authorize: (pssrId: string, values: Record<string, any> = {}) => api.post(`/pssr/${pssrId}/startup-authorization/authorize`, values).then(unwrap<any>),
  release: (pssrId: string, values: Record<string, any> = {}) => api.post(`/pssr/${pssrId}/startup-authorization/release`, values).then(unwrap<any>),
  cancel: (pssrId: string, reason: string) => api.post(`/pssr/${pssrId}/startup-authorization/cancel`, { reason }).then(unwrap<any>),
  certificate: (pssrId: string) => api.get(`/pssr/${pssrId}/startup-authorization/certificate`).then(unwrap<any>)
};
