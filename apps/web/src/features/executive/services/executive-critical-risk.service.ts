import { api } from '@/services/api';
import type {
  ExecutiveCaseDetail,
  ExecutiveCriticalRiskDashboard,
  ExecutiveEscalation,
  ExecutiveEscalationDetail,
  ExecutiveEscalationRule,
  ExecutiveOverdueAction,
  ExecutiveOverdueGroupByModule,
  ExecutiveOverdueGroupByOwner,
  ExecutiveOverdueGroupBySite,
  ExecutivePaged,
  ExecutiveRiskCase
} from '../types/executive-critical-risk.types';

type Envelope<T> = { data: T | { data?: T } };
const unwrap = <T>(response: Envelope<T>) => {
  const body = response.data as { data?: T };
  return body && typeof body === 'object' && 'data' in body ? (body.data as T) : (response.data as T);
};

const get = async <T>(path: string, params?: Record<string, unknown>) => unwrap<T>(await api.get(path, { params }));
const post = async <T>(path: string, body?: Record<string, unknown>) => unwrap<T>(await api.post(path, body ?? {}));
const patch = async <T>(path: string, body?: Record<string, unknown>) => unwrap<T>(await api.patch(path, body ?? {}));

export const executiveCriticalRiskApi = {
  // Dashboard & Recalculation
  dashboard: (params?: Record<string, unknown>) => get<ExecutiveCriticalRiskDashboard>('/executive/critical-risks/dashboard', params),
  recalculate: (body?: Record<string, unknown>) => post<{ run: Record<string, unknown>; cases: ExecutiveRiskCase[]; overdueActionSnapshots: ExecutiveOverdueAction[] }>('/executive/critical-risks/recalculate', body),

  // Critical Risks
  cases: (params?: Record<string, unknown>) => get<ExecutivePaged<ExecutiveRiskCase>>('/executive/critical-risks/register', params),
  caseDetail: (id: string) => get<ExecutiveCaseDetail>(`/executive/critical-risks/${id}`),
  acknowledge: (id: string, note?: string) => post<ExecutiveRiskCase>(`/executive/critical-risks/${id}/acknowledge`, { note }),
  assignOwner: (id: string, body: { ownerId: string; reason: string }) => post<ExecutiveRiskCase>(`/executive/critical-risks/${id}/assign-owner`, body),
  createAction: (id: string, body: Record<string, unknown>) => post<Record<string, unknown>>(`/executive/critical-risks/${id}/actions`, body),
  linkAction: (id: string, body: { actionId: string }) => post<Record<string, unknown>>(`/executive/critical-risks/${id}/actions/link`, body),
  requestVerification: (id: string, body: { verifierId: string; criteria?: string }) => post<Record<string, unknown>>(`/executive/critical-risks/${id}/request-verification`, body),
  close: (id: string, reason: string) => post<ExecutiveRiskCase>(`/executive/critical-risks/${id}/close`, { reason }),
  barriers: (params?: Record<string, unknown>) => get<ExecutivePaged<ExecutiveRiskCase>>('/executive/critical-risks/barriers', params),
  historyList: (params?: Record<string, unknown>) => get<ExecutivePaged<Record<string, unknown>>>('/executive/critical-risks/history', params),

  // Overdue Actions
  overdueActions: (params?: Record<string, unknown>) => get<ExecutivePaged<ExecutiveOverdueAction>>('/executive/overdue-actions/register', params),
  overdueAction: (id: string) => get<ExecutiveOverdueAction>(`/executive/overdue-actions/${id}`),
  overdueActionsByOwner: (params?: Record<string, unknown>) => get<{ rows: ExecutiveOverdueGroupByOwner[] }>('/executive/overdue-actions/by-owner', params),
  overdueActionsBySite: (params?: Record<string, unknown>) => get<{ rows: ExecutiveOverdueGroupBySite[] }>('/executive/overdue-actions/by-site', params),
  overdueActionsByModule: (params?: Record<string, unknown>) => get<{ rows: ExecutiveOverdueGroupByModule[] }>('/executive/overdue-actions/by-module', params),

  // Escalations
  escalations: (params?: Record<string, unknown>) => get<ExecutivePaged<ExecutiveEscalation>>('/executive/escalations/register', params),
  escalation: (id: string) => get<ExecutiveEscalationDetail>(`/executive/escalations/${id}`),
  createEscalation: (body: Record<string, unknown>) => post<ExecutiveEscalation>('/executive/escalations', body),
  acknowledgeEscalation: (id: string, note?: string) => post<ExecutiveEscalation>(`/executive/escalations/${id}/acknowledge`, { note }),
  decision: (id: string, body: { decision: string; decisionType?: string; rationale?: string }) => post<Record<string, unknown>>(`/executive/escalations/${id}/decisions`, body),
  reassignEscalation: (id: string, body: { recipientUserId: string }) => post<ExecutiveEscalation>(`/executive/escalations/${id}/reassign`, body),
  advanceEscalationLevel: (id: string, body: { reason?: string }) => post<ExecutiveEscalation>(`/executive/escalations/${id}/escalate`, body),
  cancelEscalation: (id: string, body: { reason: string }) => post<ExecutiveEscalation>(`/executive/escalations/${id}/cancel`, body),
  closeEscalation: (id: string, reason: string) => post<ExecutiveEscalation>(`/executive/escalations/${id}/close`, { reason }),

  // Rules
  rules: (params?: Record<string, unknown>) => get<ExecutiveEscalationRule[]>('/executive/escalations/rules', params),
  saveRule: (body: Record<string, unknown>, id?: string) => id ? patch<ExecutiveEscalationRule>(`/executive/escalations/rules/${id}`, body) : post<ExecutiveEscalationRule>('/executive/escalations/rules', body),
  approveRule: (id: string) => post<ExecutiveEscalationRule>(`/executive/escalations/rules/${id}/approve`, {}),
  archiveRule: (id: string, body: { reason?: string }) => post<ExecutiveEscalationRule>(`/executive/escalations/rules/${id}/archive`, body),
  dryRunRule: (body: Record<string, unknown>) => post<{ evaluatedAt: string; criteria: Record<string, unknown>; matchedCases: ExecutiveRiskCase[] }>('/executive/escalations/rules/dry-run', body),

  // Leadership Attention & Lookups
  leadership: (params?: Record<string, unknown>) => get<ExecutiveCriticalRiskDashboard>('/executive/leadership-attention', params),
  lookups: (type: string) => get<any[]>(`/executive/lookups/${type}`)
};
