import { get, patch, post } from './training-api';

const base = '/training-competency/roles-competency-profiles/competencies';

export const competencyLibraryService = {
  list: (params?: Record<string, unknown>) => get<Record<string, any>>(base, params),
  detail: (competencyId: string) => get<Record<string, any>>(`${base}/${competencyId}`),
  create: (data: Record<string, unknown>) => post<Record<string, any>>(base, data),
  update: (competencyId: string, data: Record<string, unknown>) => patch<Record<string, any>>(`${base}/${competencyId}`, data),
  archive: (competencyId: string, data?: Record<string, unknown>) => post<Record<string, any>>(`${base}/${competencyId}/archive`, data)
};
