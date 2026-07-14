import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrPhase1Service = {
  autoVerifications: (id: string) => api.get(`/pssr/${id}/auto-verifications`).then(unwrap<any[]>),
  syncAutoVerifications: (id: string) => api.post(`/pssr/${id}/auto-verifications/sync`).then(unwrap<any[]>),
  generateHazardItems: (id: string) => api.post(`/pssr/${id}/checklist/generate-hazard-items`).then(unwrap<any>),
  disciplineSignoffs: (id: string) => api.get(`/pssr/${id}/discipline-signoffs`).then(unwrap<any>),
  generateDisciplineSignoffs: (id: string) => api.post(`/pssr/${id}/discipline-signoffs/generate`).then(unwrap<any>),
  signDiscipline: (id: string, signoffId: string, values: Record<string, any>) => api.post(`/pssr/${id}/discipline-signoffs/${signoffId}/sign`, values).then(unwrap<any>),
  rejectDiscipline: (id: string, signoffId: string, values: Record<string, any>) => api.post(`/pssr/${id}/discipline-signoffs/${signoffId}/reject`, values).then(unwrap<any>),
  certificate: (id: string) => api.get(`/pssr/${id}/certificate`).then(unwrap<any>),
  certificateVersions: (id: string) => api.get(`/pssr/${id}/certificate/versions`).then(unwrap<any[]>),
  generateCertificate: (id: string) => api.post(`/pssr/${id}/certificate/generate`).then(unwrap<any>),
  validateCertificate: (id: string) => api.post(`/pssr/${id}/certificate/validate-before-release`).then(unwrap<any>),
  secureShares: (id: string) => api.get(`/pssr/${id}/secure-share`).then(unwrap<any[]>),
  createSecureShare: (id: string, values: Record<string, any>) => api.post(`/pssr/${id}/secure-share`, values).then(unwrap<any>),
  revokeSecureShare: (id: string, shareId: string) => api.delete(`/pssr/${id}/secure-share/${shareId}`).then(unwrap<any>)
};
