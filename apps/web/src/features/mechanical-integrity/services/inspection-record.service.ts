import { api } from '@/services/api';
import type {
  MiInspectionChecklistItem,
  MiInspectionDocument,
  MiInspectionFinding,
  MiInspectionLookups,
  MiInspectionReading,
  MiInspectionRecordDetail,
  MiInspectionRecordRegistryResponse,
  MiInspectionRecordSummary,
  MiInspectionReview,
  MiRemainingLifeSummary
} from '../types/inspection-record.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const inspectionRecordService = {
  registry(params: Record<string, unknown> = {}): Promise<MiInspectionRecordRegistryResponse> {
    return api.get('/mechanical-integrity/inspections', { params }).then(unwrap<MiInspectionRecordRegistryResponse>);
  },
  equipmentRegistry(equipmentId: string, params: Record<string, unknown> = {}): Promise<MiInspectionRecordRegistryResponse> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/inspection-records`, { params }).then(unwrap<MiInspectionRecordRegistryResponse>);
  },
  summary(params: Record<string, unknown> = {}): Promise<MiInspectionRecordSummary> {
    return api.get('/mechanical-integrity/inspections/summary', { params }).then(unwrap<MiInspectionRecordSummary>);
  },
  reviewQueue(params: Record<string, unknown> = {}) {
    return api.get('/mechanical-integrity/inspections/review-queue', { params }).then(unwrap<any[]>);
  },
  get(inspectionId: string): Promise<MiInspectionRecordDetail> {
    return api.get(`/mechanical-integrity/inspections/${inspectionId}`).then(unwrap<MiInspectionRecordDetail>);
  },
  create(input: Record<string, unknown>, equipmentId?: string): Promise<MiInspectionRecordDetail> {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/inspection-records` : '/mechanical-integrity/inspections';
    return api.post(url, input).then(unwrap<MiInspectionRecordDetail>);
  },
  createFromOccurrence(occurrenceId: string, input: Record<string, unknown> = {}): Promise<MiInspectionRecordDetail> {
    return api.post(`/mechanical-integrity/inspection-schedule/occurrences/${occurrenceId}/execute`, input).then(unwrap<MiInspectionRecordDetail>);
  },
  update(inspectionId: string, input: Record<string, unknown>): Promise<MiInspectionRecordDetail> {
    return api.patch(`/mechanical-integrity/inspections/${inspectionId}`, input).then(unwrap<MiInspectionRecordDetail>);
  },
  archive(inspectionId: string, reason: string): Promise<MiInspectionRecordDetail> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/archive`, { reason }).then(unwrap<MiInspectionRecordDetail>);
  },
  checklist(inspectionId: string): Promise<MiInspectionChecklistItem[]> {
    return api.get(`/mechanical-integrity/inspections/${inspectionId}/checklist`).then(unwrap<MiInspectionChecklistItem[]>);
  },
  updateChecklistItem(inspectionId: string, itemId: string, input: Record<string, unknown>): Promise<MiInspectionChecklistItem> {
    return api.patch(`/mechanical-integrity/inspections/${inspectionId}/checklist/${itemId}`, input).then(unwrap<MiInspectionChecklistItem>);
  },
  readings(inspectionId: string): Promise<MiInspectionReading[]> {
    return api.get(`/mechanical-integrity/inspections/${inspectionId}/readings`).then(unwrap<MiInspectionReading[]>);
  },
  addReading(inspectionId: string, input: Record<string, unknown>): Promise<MiInspectionReading> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/readings`, input).then(unwrap<MiInspectionReading>);
  },
  updateReading(inspectionId: string, readingId: string, input: Record<string, unknown>): Promise<MiInspectionReading> {
    return api.patch(`/mechanical-integrity/inspections/${inspectionId}/readings/${readingId}`, input).then(unwrap<MiInspectionReading>);
  },
  approveReading(inspectionId: string, readingId: string, comment?: string): Promise<MiInspectionReading> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/readings/${readingId}/approve`, { comment }).then(unwrap<MiInspectionReading>);
  },
  rejectReading(inspectionId: string, readingId: string, reason: string): Promise<MiInspectionReading> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/readings/${readingId}/reject`, { reason }).then(unwrap<MiInspectionReading>);
  },
  supersedeReading(inspectionId: string, readingId: string, input: Record<string, unknown>): Promise<MiInspectionReading> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/readings/${readingId}/supersede`, input).then(unwrap<MiInspectionReading>);
  },
  approveAllReadings(inspectionId: string): Promise<{ approved: number }> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/readings/approve-all-valid`, {}).then(unwrap<{ approved: number }>);
  },
  remainingLifePreview(inspectionId: string): Promise<MiRemainingLifeSummary> {
    return api.get(`/mechanical-integrity/inspections/${inspectionId}/remaining-life-preview`).then(unwrap<MiRemainingLifeSummary>);
  },
  recalculate(inspectionId: string) {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/recalculate`, {}).then(unwrap<any>);
  },
  equipmentRemainingLife(equipmentId: string): Promise<MiRemainingLifeSummary> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/remaining-life`).then(unwrap<MiRemainingLifeSummary>);
  },
  recalculateEquipmentRemainingLife(equipmentId: string) {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/remaining-life/recalculate-all`, {}).then(unwrap<any>);
  },
  cmlReadings(equipmentId: string, cmlId: string): Promise<MiInspectionReading[]> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/readings`).then(unwrap<MiInspectionReading[]>);
  },
  addCmlReading(equipmentId: string, cmlId: string, input: Record<string, unknown>): Promise<MiInspectionReading> {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/readings`, input).then(unwrap<MiInspectionReading>);
  },
  cmlRemainingLife(equipmentId: string, cmlId: string): Promise<MiRemainingLifeSummary> {
    return api.get(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/remaining-life`).then(unwrap<MiRemainingLifeSummary>);
  },
  recalculateCmlRemainingLife(equipmentId: string, cmlId: string) {
    return api.post(`/mechanical-integrity/equipment/${equipmentId}/cmls/${cmlId}/remaining-life/recalculate`, {}).then(unwrap<any>);
  },
  findings(inspectionId: string): Promise<MiInspectionFinding[]> {
    return api.get(`/mechanical-integrity/inspections/${inspectionId}/findings`).then(unwrap<MiInspectionFinding[]>);
  },
  addFinding(inspectionId: string, input: Record<string, unknown>): Promise<MiInspectionFinding> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/findings`, input).then(unwrap<MiInspectionFinding>);
  },
  updateFinding(inspectionId: string, findingId: string, input: Record<string, unknown>): Promise<MiInspectionFinding> {
    return api.patch(`/mechanical-integrity/inspections/${inspectionId}/findings/${findingId}`, input).then(unwrap<MiInspectionFinding>);
  },
  closeFinding(inspectionId: string, findingId: string, reason: string): Promise<MiInspectionFinding> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/findings/${findingId}/close`, { reason }).then(unwrap<MiInspectionFinding>);
  },
  linkFindingAction(inspectionId: string, findingId: string, input: Record<string, unknown>): Promise<MiInspectionFinding> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/findings/${findingId}/create-action`, input).then(unwrap<MiInspectionFinding>);
  },
  submit(inspectionId: string, comment?: string): Promise<MiInspectionRecordDetail> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/submit`, { comment }).then(unwrap<MiInspectionRecordDetail>);
  },
  approve(inspectionId: string, input: Record<string, unknown>): Promise<MiInspectionRecordDetail> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/approve`, input).then(unwrap<MiInspectionRecordDetail>);
  },
  reject(inspectionId: string, reason: string): Promise<MiInspectionRecordDetail> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/reject`, { reason }).then(unwrap<MiInspectionRecordDetail>);
  },
  returnForCorrection(inspectionId: string, reason: string): Promise<MiInspectionRecordDetail> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/return-for-correction`, { reason }).then(unwrap<MiInspectionRecordDetail>);
  },
  reviews(inspectionId: string): Promise<MiInspectionReview[]> {
    return api.get(`/mechanical-integrity/inspections/${inspectionId}/reviews`).then(unwrap<MiInspectionReview[]>);
  },
  documents(inspectionId: string): Promise<MiInspectionDocument[]> {
    return api.get(`/mechanical-integrity/inspections/${inspectionId}/documents`).then(unwrap<MiInspectionDocument[]>);
  },
  addDocument(inspectionId: string, input: Record<string, unknown>): Promise<MiInspectionDocument> {
    return api.post(`/mechanical-integrity/inspections/${inspectionId}/documents`, input).then(unwrap<MiInspectionDocument>);
  },
  lookups(): Promise<MiInspectionLookups> {
    return api.get('/mechanical-integrity/inspections/lookups').then(unwrap<MiInspectionLookups>);
  },
  importRows(input: Record<string, unknown>, equipmentId?: string) {
    const url = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/cmls/readings/import` : '/mechanical-integrity/inspections/import';
    return api.post(url, input).then(unwrap<any>);
  }
};
