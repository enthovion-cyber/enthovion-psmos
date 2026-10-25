import { api } from '@/services/api';
import type {
  ManagementReviewDashboard,
  ManagementReviewPaged,
  ManagementReviewReadiness,
  ManagementReviewRow,
  ManagementReviewCycle,
  ManagementReviewMeeting,
  ManagementReviewDecision,
  ManagementReviewCommitment,
  ManagementReviewFollowUpData,
} from '../types/executive-management-review.types';

type Envelope<T> = { data: T | { data?: T } };

const unwrap = <T>(r: Envelope<T>): T => {
  const b = r.data as { data?: T };
  return b && typeof b === 'object' && 'data' in b ? (b.data as T) : (r.data as T);
};

const get = <T>(path: string, params?: Record<string, unknown>) =>
  api.get(path, { params }).then(unwrap<T>);

const post = <T>(path: string, body?: Record<string, unknown>) =>
  api.post(path, body ?? {}).then(unwrap<T>);

const patch = <T>(path: string, body?: Record<string, unknown>) =>
  api.patch(path, body ?? {}).then(unwrap<T>);

const put = <T>(path: string, body?: Record<string, unknown>) =>
  api.put(path, body ?? {}).then(unwrap<T>);

export const managementReviewApi = {
  // Dashboard & Context
  dashboard: (p?: Record<string, unknown>) =>
    get<ManagementReviewDashboard>('/executive/management-review/dashboard', p),
  context: (p?: Record<string, unknown>) =>
    get<Record<string, any>>('/executive/management-review/context', p),
  readiness: (p?: Record<string, unknown>) =>
    get<ManagementReviewReadiness>('/executive/management-review/readiness', p),

  // Cycles
  cycles: (p?: Record<string, unknown>) =>
    get<ManagementReviewPaged>('/executive/management-review/cycles', p),
  cycle: (id: string) =>
    get<{ cycle: ManagementReviewCycle; meetings: any[]; decisions: any[]; commitments: any[]; history: any[] }>(
      `/executive/management-review/cycles/${id}`
    ),
  createCycle: (b: Record<string, unknown>) =>
    post<ManagementReviewCycle>('/executive/management-review/cycles', b),
  updateCycle: (id: string, b: Record<string, unknown>) =>
    patch<ManagementReviewCycle>(`/executive/management-review/cycles/${id}`, b),
  activateCycle: (id: string, b?: Record<string, unknown>) =>
    post<ManagementReviewCycle>(`/executive/management-review/cycles/${id}/activate`, b),
  completeCycle: (id: string, b?: Record<string, unknown>) =>
    post<ManagementReviewCycle>(`/executive/management-review/cycles/${id}/complete`, b),
  reopenCycle: (id: string, b?: Record<string, unknown>) =>
    post<ManagementReviewCycle>(`/executive/management-review/cycles/${id}/reopen`, b),
  archiveCycle: (id: string, b?: Record<string, unknown>) =>
    post<ManagementReviewCycle>(`/executive/management-review/cycles/${id}/archive`, b),

  // Meetings
  meetings: (p?: Record<string, unknown>) =>
    get<ManagementReviewPaged>('/executive/management-review/meetings', p),
  meeting: (id: string) =>
    get<{ meeting: ManagementReviewMeeting; participants: any[]; agenda: any[]; history: any[] }>(
      `/executive/management-review/meetings/${id}`
    ),
  createMeeting: (b: Record<string, unknown>) =>
    post<ManagementReviewMeeting>('/executive/management-review/meetings', b),
  updateMeeting: (id: string, b: Record<string, unknown>) =>
    patch<ManagementReviewMeeting>(`/executive/management-review/meetings/${id}`, b),
  transitionMeeting: (id: string, action: string, b?: Record<string, unknown>) =>
    post<ManagementReviewMeeting>(`/executive/management-review/meetings/${id}/${action}`, b),
  rescheduleMeeting: (id: string, b: Record<string, unknown>) =>
    post<ManagementReviewMeeting>(`/executive/management-review/meetings/${id}/reschedule`, b),
  participants: (meetingId: string) =>
    get<any[]>(`/executive/management-review/meetings/${meetingId}/participants`),
  addParticipant: (meetingId: string, b: Record<string, unknown>) =>
    post<any>(`/executive/management-review/meetings/${meetingId}/participants`, b),
  recordAttendance: (meetingId: string, b: Record<string, unknown>) =>
    post<any>(`/executive/management-review/meetings/${meetingId}/attendance`, b),

  // Agenda
  agenda: (meetingId: string) =>
    get<any[]>(`/executive/management-review/meetings/${meetingId}/agenda`),
  addAgendaItem: (meetingId: string, b: Record<string, unknown>) =>
    post<any>(`/executive/management-review/meetings/${meetingId}/agenda`, b),
  templates: (p?: Record<string, unknown>) =>
    get<ManagementReviewRow[]>('/executive/management-review/templates', p),
  saveTemplate: (b: Record<string, unknown>, id?: string) =>
    id
      ? patch(`/executive/management-review/templates/${id}`, b)
      : post('/executive/management-review/templates', b),

  // Packages
  packages: (p?: Record<string, unknown>) =>
    get<ManagementReviewPaged>('/executive/management-review/packages', p),
  package: (id: string) =>
    get<any>(`/executive/management-review/packages/${id}`),
  createPackage: (b: Record<string, unknown>) =>
    post<ManagementReviewRow>('/executive/management-review/packages', b),
  validatePackage: (id: string) =>
    post<any>(`/executive/management-review/packages/${id}/validate`),
  generatePackage: (id: string, b?: Record<string, unknown>) =>
    post(`/executive/management-review/packages/${id}/generate`, b),
  publishPackage: (id: string, b?: Record<string, unknown>) =>
    post(`/executive/management-review/packages/${id}/publish`, b),
  packageVersions: (id: string) =>
    get<any[]>(`/executive/management-review/packages/${id}/versions`),
  packageAccessLog: (id: string) =>
    get<any[]>(`/executive/management-review/packages/${id}/access-log`),

  // Minutes
  minutes: (p?: Record<string, unknown>) =>
    get<ManagementReviewPaged>('/executive/management-review/minutes', p),
  singleMinutes: (id: string) =>
    get<any>(`/executive/management-review/minutes/${id}`),
  createMinutes: (meetingId: string, b: Record<string, unknown>) =>
    post<ManagementReviewRow>(`/executive/management-review/meetings/${meetingId}/minutes`, b),
  updateMinutes: (id: string, b: Record<string, unknown>) =>
    patch<ManagementReviewRow>(`/executive/management-review/minutes/${id}`, b),
  submitMinutes: (id: string, b: Record<string, unknown>) =>
    post<ManagementReviewRow>(`/executive/management-review/minutes/${id}/submit`, b),
  requestMinutesApproval: (id: string) =>
    post<ManagementReviewRow>(`/executive/management-review/minutes/${id}/request-approval`),

  // Decisions
  decisions: (p?: Record<string, unknown>) =>
    get<ManagementReviewPaged>('/executive/management-review/decisions', p),
  singleDecision: (id: string) =>
    get<{ decision: ManagementReviewDecision; commitments: any[]; history: any[] }>(
      `/executive/management-review/decisions/${id}`
    ),
  createDecision: (b: Record<string, unknown>) =>
    post<ManagementReviewDecision>('/executive/management-review/decisions', b),
  updateDecision: (id: string, b: Record<string, unknown>) =>
    patch<ManagementReviewDecision>(`/executive/management-review/decisions/${id}`, b),
  submitDecision: (id: string) =>
    post<ManagementReviewDecision>(`/executive/management-review/decisions/${id}/submit`),

  // Commitments & Follow-up
  commitments: (p?: Record<string, unknown>) =>
    get<ManagementReviewPaged>('/executive/management-review/commitments', p),
  singleCommitment: (id: string) =>
    get<{ commitment: ManagementReviewCommitment; decision: any; history: any[] }>(
      `/executive/management-review/commitments/${id}`
    ),
  createCommitment: (b: Record<string, unknown>) =>
    post<ManagementReviewCommitment>('/executive/management-review/commitments', b),
  updateCommitment: (id: string, b: Record<string, unknown>) =>
    patch<ManagementReviewCommitment>(`/executive/management-review/commitments/${id}`, b),
  assignCommitment: (id: string, ownerId: string, note?: string) =>
    post<ManagementReviewCommitment>(`/executive/management-review/commitments/${id}/assign`, { ownerId, note }),
  requestCommitmentVerification: (id: string, verifierId?: string, criteria?: string) =>
    post<ManagementReviewCommitment>(`/executive/management-review/commitments/${id}/request-verification`, { verifierId, criteria }),
  createCommitmentAction: (id: string) =>
    post<{ commitment: any; action: any }>(`/executive/management-review/commitments/${id}/create-action`),
  carryForward: (id: string, b: Record<string, unknown>) =>
    post<any>(`/executive/management-review/commitments/${id}/carry-forward`, b),
  followUp: (p?: Record<string, unknown>) =>
    get<ManagementReviewFollowUpData>('/executive/management-review/follow-up', p),
  carriedForwardList: (p?: Record<string, unknown>) =>
    get<ManagementReviewPaged>('/executive/management-review/carried-forward', p),

  // History, Calendar & Settings
  history: (p?: Record<string, unknown>) =>
    get<ManagementReviewRow[]>('/executive/management-review/history', p),
  calendar: (p?: Record<string, unknown>) =>
    get<any[]>('/executive/management-review/calendar', p),
  settings: (p?: Record<string, unknown>) =>
    get<Record<string, unknown> | null>('/executive/management-review/settings', p),
  saveSettings: (b: Record<string, unknown>) =>
    put('/executive/management-review/settings', b),

  // Lookups
  lookups: (kind: string) =>
    get<string[]>(`/executive/lookups/${kind}`),
};
