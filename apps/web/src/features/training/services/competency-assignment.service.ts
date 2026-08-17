import { get, post, remove } from './training-api';

const base = '/training-competency/roles-competency-profiles/assignments';

export const competencyAssignmentService = {
  list: (params?: Record<string, unknown>) => get<Record<string, any>>(base, params),
  assign: (data: Record<string, unknown>) => post<Record<string, any>>(base, data),
  remove: (assignmentId: string, data: Record<string, unknown>) => remove<Record<string, any>>(`${base}/${assignmentId}`, data)
};
