import type { WorkerDetail, WorkforceResponse } from '../types/training.types';
import { get, patch, post, remove } from './training-api';

export const workforceService = {
  workforce: (params: Record<string, unknown> = {}) => get<WorkforceResponse>('/training-competency/workforce', params),
  summary: (params: Record<string, unknown> = {}) => get<Record<string, number>>('/training-competency/workforce/summary', params),
  context: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/training-competency/context', params),
  worker: (workerId: string) => get<WorkerDetail>(`/training-competency/workforce/${workerId}`),
  create: (values: Record<string, any>) => post<WorkerDetail>('/training-competency/workforce', values),
  update: (workerId: string, values: Record<string, any>) => patch<WorkerDetail>(`/training-competency/workforce/${workerId}`, values),
  archive: (workerId: string, reason: string) => post<WorkerDetail>(`/training-competency/workforce/${workerId}/archive`, { reason }),
  reactivate: (workerId: string, reason?: string) => post<WorkerDetail>(`/training-competency/workforce/${workerId}/reactivate`, { reason }),
  addAssignment: (workerId: string, values: Record<string, any>) => post<Array<Record<string, any>>>(`/training-competency/workforce/${workerId}/assignments`, values),
  updateAssignment: (workerId: string, assignmentId: string, values: Record<string, any>) => patch<Array<Record<string, any>>>(`/training-competency/workforce/${workerId}/assignments/${assignmentId}`, values),
  removeAssignment: (workerId: string, assignmentId: string, reason: string) => remove<Array<Record<string, any>>>(`/training-competency/workforce/${workerId}/assignments/${assignmentId}`, { reason }),
  addRoleAssignment: (workerId: string, values: Record<string, any>) => post<Array<Record<string, any>>>(`/training-competency/workforce/${workerId}/role-assignments`, values),
  linkAccount: (workerId: string, values: Record<string, any>) => post<Record<string, any>>(`/training-competency/workforce/${workerId}/account-link`, values),
  inviteAccount: (workerId: string, values: Record<string, any>) => post<Record<string, any>>(`/training-competency/workforce/${workerId}/invite-user-account`, values),
  linkDocument: (workerId: string, values: Record<string, any>) => post<Array<Record<string, any>>>(`/training-competency/workforce/${workerId}/documents/link`, values),
  recalculateStatus: (workerId: string) => post<Record<string, any>>(`/training-competency/workforce/${workerId}/status/recalculate`)
};
