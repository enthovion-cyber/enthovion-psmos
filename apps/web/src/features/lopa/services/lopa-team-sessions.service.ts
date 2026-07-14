import { api } from '@/services/api';
import type { LopaSessionAgendaInput } from '../types/lopa-session-agenda.types';
import type { LopaSessionAttendanceInput } from '../types/lopa-session-attendance.types';
import type { LopaSessionDecisionInput, LopaSessionMinutesInput } from '../types/lopa-session-minutes.types';
import type { LopaSessionInput } from '../types/lopa-team-session.types';
import type { LopaTeamMemberInput, LopaTeamSessionsFilters, LopaTeamSessionsTabData } from '../types/lopa-team-member.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const lopaTeamSessionsService = {
  get: (id: string, filters: LopaTeamSessionsFilters = {}) => api.get(`/lopa/${id}/team-sessions`, { params: filters }).then(unwrap<LopaTeamSessionsTabData>),
  context: (id: string) => api.get(`/lopa/${id}/team-sessions/context`).then(unwrap<Record<string, any>>),
  userSearch: (id: string, filters: LopaTeamSessionsFilters = {}) => api.get(`/lopa/${id}/team-sessions/user-search`, { params: filters }).then(unwrap<any[]>),
  createMember: (id: string, values: LopaTeamMemberInput) => api.post(`/lopa/${id}/team-members`, values).then(unwrap<any>),
  updateMember: (id: string, memberId: string, values: LopaTeamMemberInput) => api.patch(`/lopa/${id}/team-members/${memberId}`, values).then(unwrap<any>),
  removeMember: (id: string, memberId: string, reason?: string) => api.delete(`/lopa/${id}/team-members/${memberId}`, { data: { reason } }).then(unwrap<any>),
  inviteMember: (id: string, memberId: string, message?: string) => api.post(`/lopa/${id}/team-members/${memberId}/invite`, { message }).then(unwrap<any>),
  resendInvite: (id: string, memberId: string) => api.post(`/lopa/${id}/team-members/${memberId}/resend-invite`, {}).then(unwrap<any>),
  cancelInvite: (id: string, memberId: string, reason?: string) => api.post(`/lopa/${id}/team-members/${memberId}/cancel-invite`, { reason }).then(unwrap<any>),
  createSession: (id: string, values: LopaSessionInput) => api.post(`/lopa/${id}/sessions`, values).then(unwrap<any>),
  updateSession: (id: string, sessionId: string, values: LopaSessionInput) => api.patch(`/lopa/${id}/sessions/${sessionId}`, values).then(unwrap<any>),
  cancelSession: (id: string, sessionId: string, reason: string) => api.post(`/lopa/${id}/sessions/${sessionId}/cancel`, { reason }).then(unwrap<any>),
  completeSession: (id: string, sessionId: string) => api.post(`/lopa/${id}/sessions/${sessionId}/complete`).then(unwrap<any>),
  lockMinutes: (id: string, sessionId: string, reason?: string) => api.post(`/lopa/${id}/sessions/${sessionId}/lock-minutes`, { reason }).then(unwrap<any>),
  unlockMinutes: (id: string, sessionId: string, reason: string) => api.post(`/lopa/${id}/sessions/${sessionId}/unlock-minutes`, { reason }).then(unwrap<any>),
  sessionDetail: (id: string, sessionId: string) => api.get(`/lopa/${id}/sessions/${sessionId}`).then(unwrap<any>),
  createAgenda: (id: string, sessionId: string, values: LopaSessionAgendaInput) => api.post(`/lopa/${id}/sessions/${sessionId}/agenda`, values).then(unwrap<any>),
  updateAttendance: (id: string, sessionId: string, rows: LopaSessionAttendanceInput[]) => api.patch(`/lopa/${id}/sessions/${sessionId}/attendance`, { rows }).then(unwrap<any>),
  updateMinutes: (id: string, sessionId: string, values: LopaSessionMinutesInput) => api.patch(`/lopa/${id}/sessions/${sessionId}/minutes`, values).then(unwrap<any>),
  createDecision: (id: string, sessionId: string, values: LopaSessionDecisionInput) => api.post(`/lopa/${id}/sessions/${sessionId}/decisions`, values).then(unwrap<any>),
  createAction: (id: string, sessionId: string, values: Record<string, unknown>) => api.post(`/lopa/${id}/sessions/${sessionId}/actions/create`, values).then(unwrap<any>),
  syncActions: (id: string, sessionId: string) => api.post(`/lopa/${id}/sessions/${sessionId}/actions/sync`).then(unwrap<any>),
  export: (id: string) => api.get(`/lopa/${id}/team-sessions/export-attendance`).then(unwrap<any>)
};
