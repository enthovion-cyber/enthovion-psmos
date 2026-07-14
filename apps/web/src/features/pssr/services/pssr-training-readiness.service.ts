import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrTrainingReadinessService = {
  get: (pssrId: string) => api.get(`/pssr/${pssrId}/training-readiness`).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/training-readiness/summary`).then(unwrap<any>),
  generate: (pssrId: string) => api.post(`/pssr/${pssrId}/training-readiness/generate`).then(unwrap<any>),
  syncFromMoc: (pssrId: string) => api.post(`/pssr/${pssrId}/training-readiness/sync-from-moc`).then(unwrap<any>),
  syncFromDocuments: (pssrId: string) => api.post(`/pssr/${pssrId}/training-readiness/sync-from-documents`).then(unwrap<any>),
  addRequirement: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/training-requirements`, values).then(unwrap<any>),
  updateRequirement: (pssrId: string, requirementId: string, values: Record<string, any>) => api.patch(`/pssr/${pssrId}/training-requirements/${requirementId}`, values).then(unwrap<any>),
  deleteRequirement: (pssrId: string, requirementId: string) => api.delete(`/pssr/${pssrId}/training-requirements/${requirementId}`).then(unwrap<any>),
  complete: (pssrId: string, assignmentId: string) => api.post(`/pssr/${pssrId}/training-assignments/${assignmentId}/complete`, {}).then(unwrap<any>),
  evidence: (pssrId: string, assignmentId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/training-assignments/${assignmentId}/evidence`, values).then(unwrap<any>),
  verify: (pssrId: string, assignmentId: string, comment?: string) => api.post(`/pssr/${pssrId}/training-assignments/${assignmentId}/verify`, { comment }).then(unwrap<any>),
  reject: (pssrId: string, assignmentId: string, reason: string) => api.post(`/pssr/${pssrId}/training-assignments/${assignmentId}/reject`, { reason }).then(unwrap<any>),
  waive: (pssrId: string, assignmentId: string, reason: string) => api.post(`/pssr/${pssrId}/training-assignments/${assignmentId}/waive`, { reason }).then(unwrap<any>),
  reminder: (pssrId: string, assignmentId: string) => api.post(`/pssr/${pssrId}/training-assignments/${assignmentId}/reminder`, {}).then(unwrap<any>),
  acknowledge: (pssrId: string, ackId: string, comment?: string) => api.post(`/pssr/${pssrId}/personnel-acknowledgements/${ackId}/acknowledge`, { comment }).then(unwrap<any>),
  waiveAcknowledgement: (pssrId: string, ackId: string, reason: string) => api.post(`/pssr/${pssrId}/personnel-acknowledgements/${ackId}/waive`, { reason }).then(unwrap<any>),
  blockers: (pssrId: string) => api.get(`/pssr/${pssrId}/training-readiness/blockers`).then(unwrap<any[]>)
};
