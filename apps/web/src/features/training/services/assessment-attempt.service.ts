import { get, post } from './training-api';

const base = '/training-competency/assessments/attempts';

export const assessmentAttemptService = {
  detail: (attemptId: string) => get<Record<string, unknown>>(`${base}/${attemptId}`),
  saveAnswer: (attemptId: string, payload: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${attemptId}/save-answer`, payload),
  submit: (attemptId: string, payload?: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${attemptId}/submit`, payload),
  grade: (attemptId: string, payload: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${attemptId}/grade`, payload),
  verify: (attemptId: string, payload?: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${attemptId}/verify`, payload),
  reopen: (attemptId: string, payload: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${attemptId}/reopen`, payload)
};
