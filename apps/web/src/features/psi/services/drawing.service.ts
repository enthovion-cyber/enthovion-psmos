import { get, patch, post, remove } from './psi-api';
import type { DrawingDetail, DrawingLookups, DrawingRegistry, DrawingSummary } from '../types/drawing.types';

const base = '/process-safety-information';

export const drawingService = {
  registry: (params: Record<string, unknown> = {}) => get<DrawingRegistry>(`${base}/drawings`, params),
  unitRegistry: (unitId: string, params: Record<string, unknown> = {}) => get<DrawingRegistry>(`${base}/units/${unitId}/drawings`, params),
  equipmentRegistry: (equipmentId: string, params: Record<string, unknown> = {}) => get<DrawingRegistry>(`${base}/equipment/${equipmentId}/drawings`, params),
  summary: (params: Record<string, unknown> = {}) => get<DrawingSummary>(`${base}/drawings/summary`, params),
  detail: (drawingId: string) => get<DrawingDetail>(`${base}/drawings/${drawingId}`),
  create: (input: Record<string, unknown>) => post<DrawingDetail>(`${base}/drawings`, input),
  createForUnit: (unitId: string, input: Record<string, unknown>) => post<DrawingDetail>(`${base}/units/${unitId}/drawings`, input),
  update: (drawingId: string, input: Record<string, unknown>) => patch<DrawingDetail>(`${base}/drawings/${drawingId}`, input),
  archive: (drawingId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/archive`, input),
  reactivate: (drawingId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/reactivate`, input),
  clone: (drawingId: string, input: Record<string, unknown>) => post<DrawingDetail>(`${base}/drawings/${drawingId}/clone`, input),
  linkDocument: (drawingId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/documents/link`, input),
  unlinkDocument: (drawingId: string, documentLinkId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${base}/drawings/${drawingId}/documents/${documentLinkId}`, input),
  syncDocumentStatus: (drawingId: string) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/documents/sync-status`, {}),
  updateScope: (drawingId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/drawings/${drawingId}/scope`, input),
  addRelationship: (drawingId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/relationships`, input),
  removeRelationship: (drawingId: string, relationshipId: string, input: Record<string, unknown>) => remove<Record<string, unknown>>(`${base}/drawings/${drawingId}/relationships/${relationshipId}`, input),
  addTag: (drawingId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/tag-index`, input),
  updateTag: (drawingId: string, tagId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/drawings/${drawingId}/tag-index/${tagId}`, input),
  removeTag: (drawingId: string, tagId: string) => remove<Record<string, unknown>>(`${base}/drawings/${drawingId}/tag-index/${tagId}`),
  importTagIndex: (drawingId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/tag-index/import`, input),
  verifyTagIndex: (drawingId: string) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/tag-index/verify`, {}),
  updateMocRedlines: (drawingId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/drawings/${drawingId}/moc-redlines`, input),
  markAsBuiltVerified: (drawingId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/mark-as-built-verified`, input),
  runCompleteness: (drawingId: string) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/completeness/run`, {}),
  runConflictCheck: (drawingId: string) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/conflict-check/run`, {}),
  overrideConflict: (drawingId: string, conflictId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/conflicts/${conflictId}/override`, input),
  submitReview: (drawingId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/${drawingId}/submit-review`, input),
  importTemplate: () => get<Record<string, unknown>>(`${base}/drawings/import-template`),
  importPreview: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/drawings/import`, input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, unknown>>(`${base}/drawings/export`, params),
  lookups: async (): Promise<DrawingLookups> => ({
    drawingTypes: await get<string[]>(`${base}/lookups/drawing-types`),
    drawingDisciplines: await get<string[]>(`${base}/lookups/drawing-disciplines`),
    drawingStatuses: await get<string[]>(`${base}/lookups/drawing-statuses`),
    tagTypes: await get<string[]>(`${base}/lookups/tag-types`),
    tagVerificationStatuses: await get<string[]>(`${base}/lookups/tag-verification-statuses`),
    tagSourceMethods: ['Manual', 'CSV import', 'Document OCR', 'CAD extraction', 'AI extraction', 'Synced from Equipment Registry', 'Synced from MI', 'Synced from Instrument Index'],
    redlineStatuses: await get<string[]>(`${base}/lookups/redline-statuses`),
    mocDrawingUpdateStatuses: await get<string[]>(`${base}/lookups/moc-drawing-update-statuses`),
    drawingConflictStatuses: await get<string[]>(`${base}/lookups/drawing-conflict-statuses`),
    relationshipTypes: await get<string[]>(`${base}/lookups/drawing-relationship-types`)
  })
};
