import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocCommunicationTrainingService = {
  get: (id: string) => api.get(`/moc/${id}/communication-training`).then(unwrap<any>),
  createStakeholder: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/stakeholders`, values).then(unwrap<any>),
  updateStakeholder: (id: string, stakeholderId: string, values: Record<string, any>) => api.patch(`/moc/${id}/stakeholders/${stakeholderId}`, values).then(unwrap<any>),
  deleteStakeholder: (id: string, stakeholderId: string) => api.delete(`/moc/${id}/stakeholders/${stakeholderId}`).then(unwrap<any>),
  importFromImpact: (id: string) => api.post(`/moc/${id}/stakeholders/import-from-impact`).then(unwrap<any[]>),
  importFromEquipment: (id: string) => api.post(`/moc/${id}/stakeholders/import-from-equipment`).then(unwrap<any[]>),
  updatePlan: (id: string, values: Record<string, any>) => api.patch(`/moc/${id}/communication-plan`, values).then(unwrap<any>),
  sendCommunication: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/communication/send`, values).then(unwrap<any>),
  scheduleCommunication: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/communication/schedule`, values).then(unwrap<any>),
  resendLog: (id: string, logId: string) => api.post(`/moc/${id}/communication/logs/${logId}/resend`).then(unwrap<any>),
  remindLog: (id: string, logId: string) => api.post(`/moc/${id}/communication/logs/${logId}/reminder`).then(unwrap<any>),
  acknowledge: (id: string, ackId: string, values: Record<string, any>) => api.post(`/moc/${id}/acknowledgements/${ackId}/acknowledge`, values).then(unwrap<any>),
  remindAck: (id: string, ackId: string) => api.post(`/moc/${id}/acknowledgements/${ackId}/reminder`).then(unwrap<any>),
  waiveAck: (id: string, ackId: string, values: Record<string, any>) => api.post(`/moc/${id}/acknowledgements/${ackId}/waive`, values).then(unwrap<any>),
  createTraining: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/training-requirements`, values).then(unwrap<any>),
  updateTraining: (id: string, requirementId: string, values: Record<string, any>) => api.patch(`/moc/${id}/training-requirements/${requirementId}`, values).then(unwrap<any>),
  deleteTraining: (id: string, requirementId: string) => api.delete(`/moc/${id}/training-requirements/${requirementId}`).then(unwrap<any>),
  generateTrainingFromImpact: (id: string) => api.post(`/moc/${id}/training-requirements/generate-from-impact`).then(unwrap<any[]>),
  assignTraining: (id: string, requirementId: string, values: Record<string, any>) => api.post(`/moc/${id}/training-requirements/${requirementId}/assign`, values).then(unwrap<any[]>),
  completeAssignment: (id: string, assignmentId: string, values: Record<string, any>) => api.post(`/moc/${id}/training-assignments/${assignmentId}/complete`, values).then(unwrap<any>),
  verifyAssignment: (id: string, assignmentId: string, values: Record<string, any>) => api.post(`/moc/${id}/training-assignments/${assignmentId}/verify`, values).then(unwrap<any>),
  waiveAssignment: (id: string, assignmentId: string, values: Record<string, any>) => api.post(`/moc/${id}/training-assignments/${assignmentId}/waive`, values).then(unwrap<any>)
};
