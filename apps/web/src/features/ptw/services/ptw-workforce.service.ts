import { api } from '@/services/api';
import type { BriefingValues, WorkerValues } from '../schemas/workforce.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type PermitWorkerRecord = {
  id: string;
  permit_id: string;
  user_id?: string | null;
  worker_name: string;
  worker_type?: string | null;
  company?: string | null;
  employer_company?: string | null;
  contractor_company_id?: string | null;
  trade?: string | null;
  badge_id?: string | null;
  phone?: string | null;
  contact_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  role?: string | null;
  role_on_permit?: string | null;
  is_permit_holder?: boolean;
  is_performing_authority?: boolean;
  is_area_authority?: boolean;
  is_permit_issuer?: boolean;
  is_fire_watch?: boolean;
  is_attendant?: boolean;
  is_entry_supervisor?: boolean;
  is_gas_tester?: boolean;
  is_isolation_authority?: boolean;
  briefing_required?: boolean;
  signed_briefing?: boolean;
  briefing_completed?: boolean;
  briefing_completed_at?: string | null;
  signed_in?: boolean;
  signed_in_at?: string | null;
  signed_out?: boolean;
  signed_out_at?: string | null;
  time_in?: string | null;
  time_out?: string | null;
  status?: string | null;
  notes?: string | null;
};

export type WorkforceSummary = {
  totalPersonnel: number;
  signedInPersonnel: number;
  signedOutPersonnel: number;
  briefingCompletedPercent: number;
  contractorPersonnel: number;
  internalPersonnel: number;
  maximumPersonnelAllowed?: number | null;
  workforceStatus: string;
  activationBlocked: boolean;
  activationBlockers: string[];
  closureBlocked: boolean;
  closureBlockers: string[];
  emergency: {
    currentlySignedIn: number;
    missingSignOut: number;
    emergencyContacts: Array<{ workerName: string; name?: string | null; phone?: string | null }>;
    lastAccountabilityCheck?: string | null;
    accountabilityConfirmedBy?: string | null;
    accountabilityConfirmedAt?: string | null;
  };
};

export type RequiredRole = { role: string; filled: boolean; workers: PermitWorkerRecord[] };

export type BriefingRecord = {
  id: string;
  briefing_title: string;
  briefing_topic: string;
  briefing_notes?: string | null;
  conducted_by?: string | null;
  conducted_at: string;
  required_for_all_workers: boolean;
  completed_count: number;
  missing_count: number;
  status: string;
};

export type WorkforceHistory = {
  id: string;
  workforce_id?: string | null;
  event_type: string;
  description: string;
  user_id?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  created_at: string;
};

export const ptwWorkforceService = {
  list: (permitId: string) => api.get(`/ptw/${permitId}/workforce`).then(unwrap<PermitWorkerRecord[]>),
  summary: (permitId: string) => api.get(`/ptw/${permitId}/workforce/summary`).then(unwrap<WorkforceSummary>),
  requiredRoles: (permitId: string) => api.get(`/ptw/${permitId}/workforce/required-roles`).then(unwrap<RequiredRole[]>),
  history: (permitId: string) => api.get(`/ptw/${permitId}/workforce/history`).then(unwrap<WorkforceHistory[]>),
  briefings: (permitId: string) => api.get(`/ptw/${permitId}/briefings`).then(unwrap<BriefingRecord[]>),
  create: (permitId: string, input: WorkerValues) => api.post(`/ptw/${permitId}/workforce`, toWorkerApi(input)).then(unwrap<PermitWorkerRecord>),
  update: (permitId: string, workerId: string, input: Partial<WorkerValues>) => api.patch(`/ptw/${permitId}/workforce/${workerId}`, toWorkerApi(input)).then(unwrap<PermitWorkerRecord>),
  remove: (permitId: string, workerId: string) => api.delete(`/ptw/${permitId}/workforce/${workerId}`).then(unwrap<{ deleted: boolean; id: string }>),
  completeBriefing: (permitId: string, workerId: string) => api.post(`/ptw/${permitId}/workforce/${workerId}/briefing`, {}).then(unwrap<PermitWorkerRecord>),
  signIn: (permitId: string, workerId: string) => api.post(`/ptw/${permitId}/workforce/${workerId}/sign-in`).then(unwrap<PermitWorkerRecord>),
  signOut: (permitId: string, workerId: string) => api.post(`/ptw/${permitId}/workforce/${workerId}/sign-out`).then(unwrap<PermitWorkerRecord>),
  bulkBriefing: (permitId: string, workerIds?: string[]) => api.post(`/ptw/${permitId}/workforce/bulk-briefing`, { workerIds }).then(unwrap<{ count: number; rows: PermitWorkerRecord[] }>),
  bulkSignIn: (permitId: string, workerIds?: string[]) => api.post(`/ptw/${permitId}/workforce/bulk-sign-in`, { workerIds }).then(unwrap<{ count: number; rows: PermitWorkerRecord[] }>),
  bulkSignOut: (permitId: string, workerIds?: string[]) => api.post(`/ptw/${permitId}/workforce/bulk-sign-out`, { workerIds }).then(unwrap<{ count: number; rows: PermitWorkerRecord[] }>),
  createBriefing: (permitId: string, input: BriefingValues) => api.post(`/ptw/${permitId}/briefings`, input).then(unwrap<BriefingRecord>),
  updateBriefing: (permitId: string, briefingId: string, input: BriefingValues) => api.patch(`/ptw/${permitId}/briefings/${briefingId}`, input).then(unwrap<BriefingRecord>),
  accountabilityCheck: (permitId: string, notes?: string) => api.post(`/ptw/${permitId}/workforce/accountability-check`, { notes }).then(unwrap<{ complete: boolean; signedIn: PermitWorkerRecord[]; checkedAt: string; confirmedBy: string }>)
};

function toWorkerApi(input: Partial<WorkerValues>) {
  return {
    ...input,
    company: input.employerCompany,
    role: input.roleOnPermit,
    phone: input.contactNumber,
    signedBriefing: input.briefingCompleted
  };
}
