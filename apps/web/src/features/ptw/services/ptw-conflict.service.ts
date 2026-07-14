import { api } from '@/services/api';
import type { ConflictOverrideValues, MatrixRuleValues, SimopsControlValues, SimopsReviewValues } from '../schemas/conflict.schema';

function unwrap<T>(response: { data: { data: T } }) { return response.data.data; }

export type PermitConflictRecord = {
  id: string;
  conflict_type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  status: string;
  override_status?: string | null;
  description: string;
  why_it_matters?: string | null;
  required_controls?: string[] | null;
  recommended_action?: string | null;
  conflicting_permit_id?: string | null;
  conflicting_permit?: { id: string; permit_number: string; permit_type: string; status: string; title: string; job_area?: string | null; equipment_tag?: string | null };
  equipment_id?: string | null;
  conflicting_equipment_id?: string | null;
  distance_meters?: number | null;
  detected_by?: string | null;
  detected_at?: string | null;
  resolution_notes?: string | null;
};

export type ConflictSummary = {
  total: number;
  open: number;
  overridden: number;
  resolved: number;
  critical: number;
  high: number;
  lastCheckedAt?: string | null;
  lastCheckedBy?: string | null;
  overallStatus: string;
  activationBlocked: boolean;
  blockers: string[];
  checkScope: string[];
};

export type SimopsReview = {
  id: string;
  simops_required: boolean;
  coordinator_name?: string | null;
  concurrent_work_description?: string | null;
  interaction_hazards?: string | null;
  required_controls?: string | null;
  control_room_acknowledged: boolean;
  area_authority_reviewed: boolean;
  status: string;
  comments?: string | null;
  controls?: SimopsControl[];
};

export type SimopsControl = { id: string; control_description: string; responsible_user_id?: string | null; due_at?: string | null; status: string; completed_at?: string | null };
export type ConflictMatrixRule = { id: string; permit_type_a: string; permit_type_b: string; conflict_type: string; severity: string; block_activation: boolean; override_allowed: boolean; required_control?: string | null; radius_meters?: number | null };
export type ConflictMap = { currentPermit: Record<string, unknown>; radiusMeters: number; markers: Array<Record<string, unknown>>; areas: string[] };
export type ConflictHistory = { id: string; event_type: string; description: string; user_id?: string | null; created_at: string };

export const ptwConflictService = {
  list: (permitId: string) => api.get(`/ptw/${permitId}/conflicts`).then(unwrap<PermitConflictRecord[]>),
  summary: (permitId: string) => api.get(`/ptw/${permitId}/conflicts/summary`).then(unwrap<ConflictSummary>),
  detail: (permitId: string, conflictId: string) => api.get(`/ptw/${permitId}/conflicts/${conflictId}`).then(unwrap<PermitConflictRecord & { overrides: unknown[]; history: ConflictHistory[] }>),
  runCheck: (permitId: string) => api.post(`/ptw/${permitId}/conflicts/check`).then(unwrap<PermitConflictRecord[]>),
  resolve: (permitId: string, conflictId: string, resolutionNotes: string) => api.post(`/ptw/${permitId}/conflicts/${conflictId}/resolve`, { resolutionNotes }).then(unwrap<PermitConflictRecord>),
  falsePositive: (permitId: string, conflictId: string, resolutionNotes: string) => api.post(`/ptw/${permitId}/conflicts/${conflictId}/false-positive`, { resolutionNotes }).then(unwrap<PermitConflictRecord>),
  requestOverride: (permitId: string, conflictId: string, input: ConflictOverrideValues) => api.post(`/ptw/${permitId}/conflicts/${conflictId}/override/request`, input).then(unwrap<unknown>),
  approveOverride: (permitId: string, conflictId: string, input: ConflictOverrideValues) => api.post(`/ptw/${permitId}/conflicts/${conflictId}/override/approve`, input).then(unwrap<unknown>),
  rejectOverride: (permitId: string, conflictId: string, reason: string) => api.post(`/ptw/${permitId}/conflicts/${conflictId}/override/reject`, { reason }).then(unwrap<unknown>),
  overrideHistory: (permitId: string, conflictId: string) => api.get(`/ptw/${permitId}/conflicts/${conflictId}/override-history`).then(unwrap<unknown[]>),
  simops: (permitId: string) => api.get(`/ptw/${permitId}/simops`).then(unwrap<SimopsReview | null>),
  saveSimops: (permitId: string, input: SimopsReviewValues, simopsId?: string) => simopsId ? api.patch(`/ptw/${permitId}/simops/${simopsId}`, input).then(unwrap<SimopsReview>) : api.post(`/ptw/${permitId}/simops`, input).then(unwrap<SimopsReview>),
  approveSimops: (permitId: string, simopsId: string) => api.post(`/ptw/${permitId}/simops/${simopsId}/approve`).then(unwrap<SimopsReview>),
  rejectSimops: (permitId: string, simopsId: string, reason: string) => api.post(`/ptw/${permitId}/simops/${simopsId}/reject`, { reason }).then(unwrap<SimopsReview>),
  acknowledgeControlRoom: (permitId: string, simopsId: string) => api.post(`/ptw/${permitId}/simops/${simopsId}/control-room-acknowledge`).then(unwrap<SimopsReview>),
  addControl: (permitId: string, simopsId: string, input: SimopsControlValues) => api.post(`/ptw/${permitId}/simops/${simopsId}/controls`, input).then(unwrap<SimopsControl>),
  updateControl: (permitId: string, simopsId: string, controlId: string, input: SimopsControlValues) => api.patch(`/ptw/${permitId}/simops/${simopsId}/controls/${controlId}`, input).then(unwrap<SimopsControl>),
  matrix: () => api.get('/ptw/conflict-matrix').then(unwrap<ConflictMatrixRule[]>),
  createMatrix: (input: MatrixRuleValues) => api.post('/ptw/conflict-matrix', input).then(unwrap<ConflictMatrixRule>),
  updateMatrix: (ruleId: string, input: MatrixRuleValues) => api.patch(`/ptw/conflict-matrix/${ruleId}`, input).then(unwrap<ConflictMatrixRule>),
  deleteMatrix: (ruleId: string) => api.delete(`/ptw/conflict-matrix/${ruleId}`).then(unwrap<ConflictMatrixRule>),
  map: (permitId: string) => api.get(`/ptw/${permitId}/conflicts/map`).then(unwrap<ConflictMap>),
  history: (permitId: string) => api.get(`/ptw/${permitId}/conflicts/history`).then(unwrap<ConflictHistory[]>)
};
