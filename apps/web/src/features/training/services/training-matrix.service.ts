import { get, post, patch } from './training-api';

export const trainingMatrixService = {
  dashboard: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/dashboard', params),
  matrix: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix', params),
  workerMatrix: (workerId: string) => get<Record<string, any>>(`/training-competency/workforce/${workerId}/training-matrix`),
  roleView: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/role-view', params),
  unitView: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/unit-view', params),
  scopedMatrix: (scope: 'sites' | 'units' | 'areas', id: string, params?: Record<string, unknown>) => get<Record<string, any>>(`/training-competency/${scope}/${id}/training-matrix`, params),
  evaluate: (data?: Record<string, unknown>) => post<Record<string, any>>('/training-competency/training-matrix/evaluate', data),
  evaluateWorker: (workerId: string) => post<Record<string, any>>(`/training-competency/workforce/${workerId}/training-matrix/evaluate`),
  runs: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/run-history', params),
  evaluations: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/evaluations', params),
  importTemplate: () => get<Record<string, any>>('/training-competency/training-matrix/import-template'),
  importRules: (data: Record<string, unknown>) => post<Record<string, any>>('/training-competency/training-matrix/import', data),
  exportData: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/export', params),
  history: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/history', params),
  settings: () => get<Record<string, any>>('/training-competency/training-matrix/settings'),
  updateSettings: (data: Record<string, unknown>) => patch<Record<string, any>>('/training-competency/training-matrix/settings', data)
};
