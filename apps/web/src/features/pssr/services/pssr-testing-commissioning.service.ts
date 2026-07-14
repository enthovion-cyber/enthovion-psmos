import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrTestingCommissioningService = {
  get: (pssrId: string) => api.get(`/pssr/${pssrId}/testing-commissioning`).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/testing-commissioning/summary`).then(unwrap<any>),
  generate: (pssrId: string) => api.post(`/pssr/${pssrId}/testing-commissioning/generate`).then(unwrap<any>),
  syncFromMoc: (pssrId: string) => api.post(`/pssr/${pssrId}/testing-commissioning/sync-from-moc`).then(unwrap<any>),
  syncFromEngineering: (pssrId: string) => api.post(`/pssr/${pssrId}/testing-commissioning/sync-from-engineering`).then(unwrap<any>),
  addRequirement: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/test-requirements`, values).then(unwrap<any>),
  updateRequirement: (pssrId: string, requirementId: string, values: Record<string, any>) => api.patch(`/pssr/${pssrId}/test-requirements/${requirementId}`, values).then(unwrap<any>),
  addRecord: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/test-records`, values).then(unwrap<any>),
  updateRecord: (pssrId: string, testRecordId: string, values: Record<string, any>) => api.patch(`/pssr/${pssrId}/test-records/${testRecordId}`, values).then(unwrap<any>),
  pass: (pssrId: string, testRecordId: string) => api.post(`/pssr/${pssrId}/test-records/${testRecordId}/pass`, {}).then(unwrap<any>),
  fail: (pssrId: string, testRecordId: string, reason: string) => api.post(`/pssr/${pssrId}/test-records/${testRecordId}/fail`, { reason }).then(unwrap<any>),
  evidence: (pssrId: string, testRecordId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/test-records/${testRecordId}/evidence`, values).then(unwrap<any>),
  requestVerification: (pssrId: string, testRecordId: string) => api.post(`/pssr/${pssrId}/test-records/${testRecordId}/request-verification`, {}).then(unwrap<any>),
  verify: (pssrId: string, testRecordId: string, comment?: string) => api.post(`/pssr/${pssrId}/test-records/${testRecordId}/verify`, { comment }).then(unwrap<any>),
  reject: (pssrId: string, testRecordId: string, reason: string) => api.post(`/pssr/${pssrId}/test-records/${testRecordId}/reject`, { reason }).then(unwrap<any>),
  waive: (pssrId: string, testRecordId: string, reason: string) => api.post(`/pssr/${pssrId}/test-records/${testRecordId}/waive`, { reason }).then(unwrap<any>),
  blockers: (pssrId: string) => api.get(`/pssr/${pssrId}/testing-commissioning/blockers`).then(unwrap<any[]>)
};
