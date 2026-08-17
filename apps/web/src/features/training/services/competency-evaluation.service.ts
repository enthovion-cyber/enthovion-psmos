import { get, post } from './training-api';

const base = '/training-competency/roles-competency-profiles';

export const competencyEvaluationService = {
  evaluate: (data?: Record<string, unknown>) => post<Record<string, any>>(`${base}/evaluate`, data),
  runs: (params?: Record<string, unknown>) => get<Record<string, any>>(`${base}/evaluation-runs`, params),
  worker: (workerId: string) => get<Record<string, any>>(`/training-competency/workforce/${workerId}/competency-profile`),
  evaluateWorker: (workerId: string) => post<Record<string, any>>(`/training-competency/workforce/${workerId}/competency-profile/evaluate`)
};
