import { api } from '@/services/api';
import { hazopTeamMemberBaseSchema, hazopTeamMemberSchema, hazopTeamReplaceSchema } from '../schemas/hazop-team.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

function clean(params?: Record<string, any>) {
  return Object.fromEntries(Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== '' && value !== 'All'));
}

export const hazopTeamService = {
  context: (studyId: string) => api.get(`/hazop/${studyId}/team-sessions/context`).then(unwrap<any>),
  summary: (studyId: string) => api.get(`/hazop/${studyId}/team-sessions/summary`).then(unwrap<any>),
  coverage: (studyId: string) => api.get(`/hazop/${studyId}/team-sessions/coverage`).then(unwrap<any[]>),
  readiness: (studyId: string) => api.get(`/hazop/${studyId}/team-sessions/signoff-readiness`).then(unwrap<any>),
  list: (studyId: string, params?: Record<string, any>) => api.get(`/hazop/${studyId}/team`, { params: clean(params) }).then(unwrap<any[]>),
  detail: (studyId: string, memberId: string) => api.get(`/hazop/${studyId}/team/${memberId}`).then(unwrap<any>),
  create: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/team`, hazopTeamMemberSchema.parse(values)).then(unwrap<any>),
  update: (studyId: string, memberId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/team/${memberId}`, hazopTeamMemberBaseSchema.partial().parse(values)).then(unwrap<any>),
  delete: (studyId: string, memberId: string) => api.delete(`/hazop/${studyId}/team/${memberId}`).then(unwrap<any>),
  remove: (studyId: string, memberId: string, reason?: string) => api.post(`/hazop/${studyId}/team/${memberId}/remove`, { reason }).then(unwrap<any>),
  replace: (studyId: string, memberId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/team/${memberId}/replace`, hazopTeamReplaceSchema.parse(values)).then(unwrap<any>),
  resendInvite: (studyId: string, memberId: string) => api.post(`/hazop/${studyId}/team/${memberId}/resend-invite`).then(unwrap<any>),
  export: (studyId: string) => api.post(`/hazop/${studyId}/team-sessions/export`).then(unwrap<any>)
};
