import { get, patch, post, remove } from './training-api';
import type { AssessmentAssignment, AssessmentDashboard, AssessmentDetail, AssessmentQuestion, AssessmentRegister, AssessmentResult, TrainingAssessment } from '../types/assessment.types';

const base = '/training-competency/assessments';

export const assessmentService = {
  dashboard: (params?: Record<string, unknown>) => get<AssessmentDashboard>(`${base}/dashboard`, params),
  library: (params?: Record<string, unknown>) => get<AssessmentRegister<TrainingAssessment>>(`${base}/library`, params),
  create: (payload: Record<string, unknown>) => post<TrainingAssessment>(`${base}/library`, payload),
  detail: (assessmentId: string) => get<AssessmentDetail>(`${base}/library/${assessmentId}`),
  update: (assessmentId: string, payload: Record<string, unknown>) => patch<TrainingAssessment>(`${base}/library/${assessmentId}`, payload),
  archive: (assessmentId: string, payload?: Record<string, unknown>) => post<TrainingAssessment>(`${base}/library/${assessmentId}/archive`, payload),
  questions: (assessmentId: string) => get<AssessmentQuestion[]>(`${base}/library/${assessmentId}/questions`),
  addQuestion: (assessmentId: string, payload: Record<string, unknown>) => post<AssessmentQuestion>(`${base}/library/${assessmentId}/questions`, payload),
  updateQuestion: (assessmentId: string, questionId: string, payload: Record<string, unknown>) => patch<AssessmentQuestion>(`${base}/library/${assessmentId}/questions/${questionId}`, payload),
  removeQuestion: (assessmentId: string, questionId: string, payload?: Record<string, unknown>) => remove<Record<string, unknown>>(`${base}/library/${assessmentId}/questions/${questionId}`, payload),
  assignments: (params?: Record<string, unknown>) => get<AssessmentRegister<AssessmentAssignment>>(`${base}/assignments`, params),
  createAssignment: (payload: Record<string, unknown>) => post<AssessmentAssignment>(`${base}/assignments`, payload),
  assignmentDetail: (assignmentId: string) => get<Record<string, unknown>>(`${base}/assignments/${assignmentId}`),
  startAssignment: (assignmentId: string, payload?: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/assignments/${assignmentId}/start`, payload),
  results: (params?: Record<string, unknown>) => get<AssessmentRegister<AssessmentResult>>(`${base}/results`, params),
  filteredResults: (view: 'failed' | 'pending' | 'pending-verification', params?: Record<string, unknown>) => get<AssessmentRegister<AssessmentResult>>(`${base}/${view}`, params),
  importTemplate: () => get<Record<string, unknown>>(`${base}/import-template`),
  importRows: (payload: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/import`, payload),
  exportRows: (params?: Record<string, unknown>) => get<Record<string, unknown>>(`${base}/export`, params),
  workerAssignments: (workerId: string, params?: Record<string, unknown>) => get<AssessmentRegister<AssessmentAssignment>>(`/training-competency/workforce/${workerId}/assessments`, params),
  workerResults: (workerId: string, params?: Record<string, unknown>) => get<AssessmentRegister<AssessmentResult>>(`/training-competency/workforce/${workerId}/assessment-results`, params),
  requiredTraining: (trainingId: string, params?: Record<string, unknown>) => get<AssessmentRegister<TrainingAssessment>>(`/training-competency/required-training/library/${trainingId}/assessments`, params)
};
