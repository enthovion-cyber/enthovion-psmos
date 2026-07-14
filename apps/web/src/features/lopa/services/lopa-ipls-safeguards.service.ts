import { api } from '@/services/api';
import type { LopaIplCandidateInput, LopaIplsSafeguardsData, LopaIplsSafeguardsFilters, LopaStudySafeguardInput } from '../types/lopa-ipls-safeguards.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaIplsSafeguardsService = {
  get: (id: string, filters: LopaIplsSafeguardsFilters = {}) => api.get(`/lopa/${id}/ipls-safeguards`, { params: filters }).then(unwrap<LopaIplsSafeguardsData>),
  importHazop: (id: string) => api.post(`/lopa/${id}/safeguards/import-hazop`).then(unwrap<any[]>),
  createSafeguard: (id: string, values: LopaStudySafeguardInput) => api.post(`/lopa/${id}/safeguards`, values).then(unwrap<any>),
  updateSafeguard: (id: string, safeguardId: string, values: Partial<LopaStudySafeguardInput>) => api.patch(`/lopa/${id}/safeguards/${safeguardId}`, values).then(unwrap<any>),
  markCandidate: (id: string, safeguardId: string, values: LopaIplCandidateInput) => api.post(`/lopa/${id}/safeguards/${safeguardId}/mark-ipl-candidate`, values).then(unwrap<any>),
  rejectSafeguard: (id: string, safeguardId: string, reason: string) => api.post(`/lopa/${id}/safeguards/${safeguardId}/reject-ipl`, { reason }).then(unwrap<any>),
  createCandidate: (id: string, values: LopaIplCandidateInput) => api.post(`/lopa/${id}/ipl-candidates`, values).then(unwrap<any>),
  updateCandidate: (id: string, candidateId: string, values: Partial<LopaIplCandidateInput>) => api.patch(`/lopa/${id}/ipl-candidates/${candidateId}`, values).then(unwrap<any>),
  selectRegistry: (id: string, registryIplId: string) => api.post(`/lopa/${id}/ipl-candidates/select-from-registry`, { registryIplId }).then(unwrap<any>),
  startValidation: (id: string, candidateId: string) => api.post(`/lopa/${id}/ipl-candidates/${candidateId}/start-validation`).then(unwrap<any>),
  submitValidation: (id: string, candidateId: string) => api.post(`/lopa/${id}/ipl-candidates/${candidateId}/submit-validation`).then(unwrap<any>),
  approveCredit: (id: string, candidateId: string, reason?: string) => api.post(`/lopa/${id}/ipl-candidates/${candidateId}/approve-credit`, { reason }).then(unwrap<any>),
  removeCredit: (id: string, candidateId: string, reason?: string) => api.post(`/lopa/${id}/ipl-candidates/${candidateId}/remove-credit`, { reason }).then(unwrap<any>),
  rejectCandidate: (id: string, candidateId: string, reason?: string) => api.post(`/lopa/${id}/ipl-candidates/${candidateId}/reject`, { reason }).then(unwrap<any>),
  reopenValidation: (id: string, candidateId: string, reason?: string) => api.post(`/lopa/${id}/ipl-candidates/${candidateId}/reopen-validation`, { reason }).then(unwrap<any>),
  createGapActions: (id: string) => api.post(`/lopa/${id}/ipls-safeguards/create-missing-data-actions`).then(unwrap<any[]>)
};
