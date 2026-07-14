import { api } from '@/services/api';
import { hazopAttendanceSchema, hazopDecisionSchema, hazopMinutesSchema, hazopSessionActionSchema, hazopSessionSchema } from '../schemas/hazop-session.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

function clean(params?: Record<string, any>) {
  return Object.fromEntries(Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== '' && value !== 'All'));
}

export const hazopSessionService = {
  list: (studyId: string, params?: Record<string, any>) => api.get(`/hazop/${studyId}/sessions`, { params: clean(params) }).then(unwrap<any[]>),
  detail: (studyId: string, sessionId: string) => api.get(`/hazop/${studyId}/sessions/${sessionId}`).then(unwrap<any>),
  create: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/sessions`, hazopSessionSchema.parse(values)).then(unwrap<any>),
  update: (studyId: string, sessionId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/sessions/${sessionId}`, hazopSessionSchema.partial().parse(values)).then(unwrap<any>),
  start: (studyId: string, sessionId: string) => api.post(`/hazop/${studyId}/sessions/${sessionId}/start`).then(unwrap<any>),
  complete: (studyId: string, sessionId: string) => api.post(`/hazop/${studyId}/sessions/${sessionId}/complete`).then(unwrap<any>),
  reschedule: (studyId: string, sessionId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/sessions/${sessionId}/reschedule`, values).then(unwrap<any>),
  cancel: (studyId: string, sessionId: string, reason?: string) => api.post(`/hazop/${studyId}/sessions/${sessionId}/cancel`, { reason }).then(unwrap<any>),
  attendance: (studyId: string, sessionId: string) => api.get(`/hazop/${studyId}/sessions/${sessionId}/attendance`).then(unwrap<any[]>),
  markAttendance: (studyId: string, sessionId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/sessions/${sessionId}/attendance`, hazopAttendanceSchema.parse(values)).then(unwrap<any>),
  updateAttendance: (studyId: string, sessionId: string, attendanceId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/sessions/${sessionId}/attendance/${attendanceId}`, hazopAttendanceSchema.partial().parse(values)).then(unwrap<any>),
  bulkAttendance: (studyId: string, sessionId: string, records: Record<string, any>[]) => api.post(`/hazop/${studyId}/sessions/${sessionId}/attendance/bulk-mark`, { records }).then(unwrap<any[]>),
  minutes: (studyId: string, sessionId: string) => api.get(`/hazop/${studyId}/sessions/${sessionId}/minutes`).then(unwrap<any[]>),
  saveMinutes: (studyId: string, sessionId: string, values: Record<string, any>, minutesId?: string) => minutesId ? api.patch(`/hazop/${studyId}/sessions/${sessionId}/minutes/${minutesId}`, hazopMinutesSchema.partial().parse(values)).then(unwrap<any>) : api.post(`/hazop/${studyId}/sessions/${sessionId}/minutes`, hazopMinutesSchema.parse(values)).then(unwrap<any>),
  approveMinutes: (studyId: string, sessionId: string, minutesId: string) => api.post(`/hazop/${studyId}/sessions/${sessionId}/minutes/${minutesId}/approve`).then(unwrap<any>),
  decisions: (studyId: string, sessionId: string) => api.get(`/hazop/${studyId}/sessions/${sessionId}/decisions`).then(unwrap<any[]>),
  addDecision: (studyId: string, sessionId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/sessions/${sessionId}/decisions`, hazopDecisionSchema.parse(values)).then(unwrap<any>),
  updateDecision: (studyId: string, sessionId: string, decisionId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/sessions/${sessionId}/decisions/${decisionId}`, hazopDecisionSchema.partial().parse(values)).then(unwrap<any>),
  deleteDecision: (studyId: string, sessionId: string, decisionId: string) => api.delete(`/hazop/${studyId}/sessions/${sessionId}/decisions/${decisionId}`).then(unwrap<any>),
  createAction: (studyId: string, sessionId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/sessions/${sessionId}/create-action`, hazopSessionActionSchema.parse(values)).then(unwrap<any>),
  linkAction: (studyId: string, sessionId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/sessions/${sessionId}/link-action`, values).then(unwrap<any>),
  unlinkAction: (studyId: string, sessionId: string, linkId: string) => api.delete(`/hazop/${studyId}/sessions/${sessionId}/link-action/${linkId}`).then(unwrap<any>),
  syncActions: (studyId: string, sessionId: string) => api.post(`/hazop/${studyId}/sessions/${sessionId}/sync-actions`).then(unwrap<any>)
};
