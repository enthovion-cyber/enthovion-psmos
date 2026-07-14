import { api } from '@/services/api';
import type { LopaSifComponentInput, LopaSifInput, LopaSilActionCreateInput, LopaSilActionInput, LopaSilData, LopaSilLinkInput } from '../types/lopa-sil-determination.types';

const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;
export const lopaSilDeterminationService = {
  get: (id: string) => api.get(`/lopa/${id}/sil-determination`).then(unwrap<LopaSilData>),
  determine: (id: string, values: LopaSilActionInput) => api.post(`/lopa/${id}/sil-determination/determine`, values).then(unwrap<any>),
  reassess: (id: string, values: LopaSilActionInput) => api.post(`/lopa/${id}/sil-determination/reassess`, values).then(unwrap<any>),
  override: (id: string, determinationId: string, values: LopaSilActionInput) => api.patch(`/lopa/${id}/sil-determination/${determinationId}`, values).then(unwrap<any>),
  lock: (id: string, values: LopaSilActionInput) => api.post(`/lopa/${id}/sil-determination/lock`, values).then(unwrap<any>),
  unlock: (id: string, values: LopaSilActionInput) => api.post(`/lopa/${id}/sil-determination/unlock`, values).then(unwrap<any>),
  createSif: (id: string, values: LopaSifInput) => api.post(`/lopa/${id}/sil-determination/sifs`, values).then(unwrap<any>),
  updateSif: (id: string, sifId: string, values: LopaSifInput) => api.patch(`/lopa/${id}/sil-determination/sifs/${sifId}`, values).then(unwrap<any>),
  deleteSif: (id: string, sifId: string, reason: string) => api.delete(`/lopa/${id}/sil-determination/sif/${sifId}`, { data: { reason } }).then(unwrap<any>),
  addComponent: (id: string, sifId: string, values: LopaSifComponentInput) => api.post(`/lopa/${id}/sil-determination/sif/${sifId}/components`, values).then(unwrap<any>),
  updateArchitecture: (id: string, sifId: string, values: Record<string, unknown>) => api.patch(`/lopa/${id}/sil-determination/sif/${sifId}/architecture`, values).then(unwrap<any>),
  updateProofTest: (id: string, sifId: string, values: Record<string, unknown>) => api.patch(`/lopa/${id}/sil-determination/sif/${sifId}/proof-test`, values).then(unwrap<any>),
  generateGaps: (id: string) => api.post(`/lopa/${id}/sil-determination/iec61511-gaps/generate`).then(unwrap<any>),
  updateGap: (id: string, gapId: string, values: Record<string, unknown>) => api.patch(`/lopa/${id}/sil-determination/iec61511-gaps/${gapId}`, values).then(unwrap<any>),
  acceptGapException: (id: string, gapId: string, reason: string) => api.post(`/lopa/${id}/sil-determination/iec61511-gaps/${gapId}/accept-exception`, { reason }).then(unwrap<any>),
  addLink: (id: string, values: LopaSilLinkInput) => api.post(`/lopa/${id}/sil-determination/links`, values).then(unwrap<any>),
  removeLink: (id: string, linkId: string, reason: string) => api.delete(`/lopa/${id}/sil-determination/links/${linkId}`, { data: { reason } }).then(unwrap<any>),
  createAction: (id: string, values: LopaSilActionCreateInput) => api.post(`/lopa/${id}/sil-determination/actions`, values).then(unwrap<any>),
  compareSnapshot: (id: string, snapshotId: string) => api.get(`/lopa/${id}/sil-determination/snapshots/${snapshotId}/compare`).then(unwrap<any>),
  checkReassessment: (id: string) => api.post(`/lopa/${id}/sil-determination/reassessment-events/check`).then(unwrap<any>)
};
