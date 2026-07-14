import { api } from '@/services/api';
import type { HandoverValues } from '../schemas/handover.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type HandoverChecklistItem = {
  id: string;
  checklist_key: string;
  checklist_label: string;
  is_required: boolean;
  is_checked: boolean;
  checked_by?: string | null;
  checked_at?: string | null;
  notes?: string | null;
};

export type PermitShiftHandover = {
  id: string;
  permit_id: string;
  current_shift_name: string;
  current_shift_start: string;
  current_shift_end: string;
  incoming_shift_name: string;
  incoming_shift_start: string;
  incoming_shift_end?: string | null;
  outgoing_supervisor_name: string;
  incoming_supervisor_name: string;
  incoming_supervisor_contact?: string | null;
  permit_status_at_handover: string;
  work_progress_status: string;
  work_progress_notes?: string | null;
  remaining_work?: string | null;
  hazards_observed?: string | null;
  special_precautions?: string | null;
  control_room_message?: string | null;
  incoming_supervisor_comments?: string | null;
  permit_expiry_at?: string | null;
  expires_within_two_hours: boolean;
  isolation_status: string;
  de_isolation_status: string;
  gas_test_status: string;
  next_gas_retest_due?: string | null;
  workforce_status: string;
  conflict_status: string;
  acknowledgement_status: string;
  acknowledged_at?: string | null;
  acknowledgement_signature_id?: string | null;
  suspended_during_handover: boolean;
  suspension_reason?: string | null;
  status: string;
  checklistItems?: HandoverChecklistItem[];
  created_at: string;
  updated_at: string;
};

export type HandoverReadiness = {
  permit: { status: string; permitType: string; riskLevel: string; activeRisks: unknown[]; requiredControls: unknown[]; safetyCritical: boolean };
  expiry: { permitExpiryAt?: string | null; expiresWithinTwoHours: boolean };
  isolation: { status: string; deIsolationStatus: string; complete: boolean };
  gasTest: { status: string; nextDueAt?: string | null; dueSoon: boolean; overdue: boolean };
  workforce: { status: string; signedInCount: number; briefingStatus: string };
  conflicts: { status: string; openCount: number };
  signatures: { complete: boolean; completedCount: number };
};

export type HandoverHistory = {
  id: string;
  event_type: string;
  description: string;
  user_id?: string | null;
  created_at: string;
};

export const ptwHandoverService = {
  list: (permitId: string) => api.get(`/ptw/${permitId}/handover`).then(unwrap<PermitShiftHandover[]>),
  current: (permitId: string) => api.get(`/ptw/${permitId}/handover/current`).then(unwrap<PermitShiftHandover | null>),
  readiness: (permitId: string) => api.get(`/ptw/${permitId}/handover/readiness`).then(unwrap<HandoverReadiness>),
  history: (permitId: string) => api.get(`/ptw/${permitId}/handover/history`).then(unwrap<HandoverHistory[]>),
  create: (permitId: string, input: HandoverValues) => api.post(`/ptw/${permitId}/handover`, toApi(input)).then(unwrap<PermitShiftHandover>),
  update: (permitId: string, handoverId: string, input: HandoverValues) => api.patch(`/ptw/${permitId}/handover/${handoverId}`, toApi(input)).then(unwrap<PermitShiftHandover>),
  remove: (permitId: string, handoverId: string) => api.delete(`/ptw/${permitId}/handover/${handoverId}`).then(unwrap<{ deleted: boolean; id: string }>),
  checklist: (permitId: string, handoverId: string, itemId: string, isChecked: boolean, notes?: string) => api.patch(`/ptw/${permitId}/handover/${handoverId}/checklist/${itemId}`, { isChecked, notes }).then(unwrap<HandoverChecklistItem>),
  acknowledge: (permitId: string, handoverId: string, signature: string, comments?: string) => api.post(`/ptw/${permitId}/handover/${handoverId}/acknowledge`, { signature, comments }).then(unwrap<PermitShiftHandover>),
  complete: (permitId: string, handoverId: string) => api.post(`/ptw/${permitId}/handover/${handoverId}/complete`).then(unwrap<PermitShiftHandover>),
  suspend: (permitId: string, handoverId: string, reason: string) => api.post(`/ptw/${permitId}/handover/${handoverId}/suspend-permit`, { reason }).then(unwrap<PermitShiftHandover>)
};

function toApi(input: HandoverValues) {
  return {
    ...input,
    currentShiftStart: new Date(input.currentShiftStart).toISOString(),
    currentShiftEnd: new Date(input.currentShiftEnd).toISOString(),
    incomingShiftStart: new Date(input.incomingShiftStart).toISOString(),
    incomingShiftEnd: input.incomingShiftEnd ? new Date(input.incomingShiftEnd).toISOString() : undefined
  };
}
