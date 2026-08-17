import { api } from '@/services/api';
import type { CriticalityAssessmentDetail, CriticalityRegistryResponse, EquipmentCriticalityResponse } from '../types/criticality.types';
import type { CriticalityAssessmentInput } from '../types/criticality-assessment.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const criticalityService = {
  registry(filters: Record<string, string | number | undefined> = {}) {
    return api.get('/mechanical-integrity/criticality', { params: filters }).then(unwrap<CriticalityRegistryResponse>);
  },
  summary(filters: Record<string, string | number | undefined> = {}) {
    return api.get('/mechanical-integrity/criticality/summary', { params: filters }).then(unwrap<Record<string, unknown>>);
  },
  reviewQueue() {
    return api.get('/mechanical-integrity/criticality/review-queue').then(unwrap<Array<Record<string, unknown>>>);
  },
  notAssessed() {
    return api.get('/mechanical-integrity/criticality/not-assessed').then(unwrap<Array<Record<string, unknown>>>);
  },
  reviewDue() {
    return api.get('/mechanical-integrity/criticality/review-due').then(unwrap<Array<Record<string, unknown>>>);
  },
  equipment(equipmentId: string) {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/criticality`).then(unwrap<EquipmentCriticalityResponse>);
  },
  equipmentSnapshot(equipmentId: string) {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/criticality/data-snapshot`).then(unwrap<Record<string, unknown>>);
  },
  equipmentSuggestions(equipmentId: string) {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/criticality/suggestions`).then(unwrap<Record<string, unknown>>);
  },
  detail(assessmentId: string) {
    return api.get(`/mechanical-integrity/criticality/assessments/${assessmentId}`).then(unwrap<CriticalityAssessmentDetail>);
  },
  create(input: CriticalityAssessmentInput) {
    return api.post('/mechanical-integrity/criticality/assessments', input).then(unwrap<CriticalityAssessmentDetail>);
  },
  createForEquipment(equipmentId: string, input: Omit<CriticalityAssessmentInput, 'equipmentId'>) {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/criticality`, input).then(unwrap<CriticalityAssessmentDetail>);
  },
  update(assessmentId: string, input: Record<string, unknown>) {
    return api.patch(`/mechanical-integrity/criticality/assessments/${assessmentId}`, input).then(unwrap<CriticalityAssessmentDetail>);
  },
  updateConsequenceScores(assessmentId: string, scores: Array<Record<string, unknown>>) {
    return api.patch(`/mechanical-integrity/criticality/assessments/${assessmentId}/consequence-scores`, { scores }).then(unwrap<CriticalityAssessmentDetail>);
  },
  updateLikelihoodScores(assessmentId: string, scores: Array<Record<string, unknown>>) {
    return api.patch(`/mechanical-integrity/criticality/assessments/${assessmentId}/likelihood-scores`, { scores }).then(unwrap<CriticalityAssessmentDetail>);
  },
  recalculate(assessmentId: string) {
    return api.post(`/mechanical-integrity/criticality/assessments/${assessmentId}/recalculate`).then(unwrap<Record<string, unknown>>);
  },
  submit(assessmentId: string, notes?: string) {
    return api.post(`/mechanical-integrity/criticality/assessments/${assessmentId}/submit`, { notes }).then(unwrap<CriticalityAssessmentDetail>);
  },
  approve(assessmentId: string, comments?: string) {
    return api.post(`/mechanical-integrity/criticality/assessments/${assessmentId}/approve`, { comments }).then(unwrap<CriticalityAssessmentDetail>);
  },
  reject(assessmentId: string, reason: string) {
    return api.post(`/mechanical-integrity/criticality/assessments/${assessmentId}/reject`, { reason }).then(unwrap<CriticalityAssessmentDetail>);
  },
  returnForCorrection(assessmentId: string, reason: string) {
    return api.post(`/mechanical-integrity/criticality/assessments/${assessmentId}/return-for-correction`, { reason }).then(unwrap<CriticalityAssessmentDetail>);
  },
  createRevision(assessmentId: string, reason: string) {
    return api.post(`/mechanical-integrity/criticality/assessments/${assessmentId}/create-revision`, { reason }).then(unwrap<CriticalityAssessmentDetail>);
  },
  archive(assessmentId: string, reason: string) {
    return api.post(`/mechanical-integrity/criticality/assessments/${assessmentId}/archive`, { reason }).then(unwrap<Record<string, unknown>>);
  }
};
