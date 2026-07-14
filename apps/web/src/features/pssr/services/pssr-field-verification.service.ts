import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrFieldVerificationService = {
  get: (pssrId: string) => api.get(`/pssr/${pssrId}/field-verification`).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/field-verification/summary`).then(unwrap<any>),
  equipment: (pssrId: string) => api.get(`/pssr/${pssrId}/field-verification/equipment`).then(unwrap<any[]>),
  generate: (pssrId: string) => api.post(`/pssr/${pssrId}/field-verification/generate`).then(unwrap<any>),
  updateEquipment: (pssrId: string, verificationId: string, values: Record<string, any>) => api.patch(`/pssr/${pssrId}/field-verification/equipment/${verificationId}`, values).then(unwrap<any>),
  verifyEquipment: (pssrId: string, verificationId: string) => api.post(`/pssr/${pssrId}/field-verification/equipment/${verificationId}/verify`, {}).then(unwrap<any>),
  failEquipment: (pssrId: string, verificationId: string, reason: string) => api.post(`/pssr/${pssrId}/field-verification/equipment/${verificationId}/fail`, { reason }).then(unwrap<any>),
  equipmentChecklist: (pssrId: string, verificationId: string) => api.get(`/pssr/${pssrId}/field-verification/equipment/${verificationId}/checklist`).then(unwrap<any[]>),
  updateChecklistItem: (pssrId: string, itemId: string, values: Record<string, any>) => api.patch(`/pssr/${pssrId}/field-verification/checklist/${itemId}`, values).then(unwrap<any>),
  evidence: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/field-verification/evidence`, values).then(unwrap<any>),
  signoff: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/field-verification/signoff`, values).then(unwrap<any>),
  blockers: (pssrId: string) => api.get(`/pssr/${pssrId}/field-verification/blockers`).then(unwrap<any[]>),
  scanEquipment: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/field-verification/scan-equipment`, values).then(unwrap<any>)
};
