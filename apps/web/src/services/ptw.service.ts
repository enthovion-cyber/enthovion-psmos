import { api } from './api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type Permit = {
  id: string;
  permit_number: string;
  permit_type: string;
  title: string;
  work_description: string;
  status: string;
  risk_level: string;
  equipment_id?: string | null;
  equipment_tag?: string | null;
  equipment_name?: string | null;
  location?: string | null;
  job_area?: string | null;
  planned_start_at: string;
  planned_end_at: string;
  extension_count?: number;
  required_controls?: Record<string, unknown>;
  type_specific_data?: Record<string, unknown>;
  max_personnel?: number | null;
  equipment?: { id: string; tag: string; name: string; type?: string; criticality?: string; safetyCritical?: boolean } | null;
  issuer?: { id: string; displayName: string; title?: string | null } | null;
  holder?: { id: string; displayName: string; title?: string | null } | null;
  site?: { id: string; name: string; code: string } | null;
  unit?: { id: string; name: string; code: string } | null;
  area?: { id: string; name: string; code: string } | null;
  isolations?: PermitIsolation[];
  gasTests?: GasTest[];
  conflicts?: PermitConflict[];
  workforce?: PermitWorker[];
  handovers?: PermitHandover[];
  attachments?: PermitAttachment[];
  history?: PermitHistory[];
  signatures?: PermitSignature[];
  closureChecklist?: { id: string; items: Record<string, boolean> } | null;
};

export type PermitIsolation = {
  id: string;
  energy_type: string;
  source_description: string;
  isolation_point: string;
  equipment_id?: string | null;
  equipment_tag?: string | null;
  isolation_point_tag?: string | null;
  isolation_point_description?: string | null;
  valve_tag?: string | null;
  breaker_tag?: string | null;
  blind_spade_number?: string | null;
  required_position?: string | null;
  normal_position?: string | null;
  current_position?: string | null;
  lock_number?: string | null;
  lock_holder?: string | null;
  lock_holder_name?: string | null;
  isolation_method?: string | null;
  isolation_status?: string | null;
  status: string;
  verification_required?: boolean;
  second_person_verification_required?: boolean;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  deisolated_by?: string | null;
  deisolated_at?: string | null;
  removal_verified_by?: string | null;
  removal_verified_at?: string | null;
  notes?: string | null;
};
export type GasTest = {
  id: string;
  tested_at: string;
  test_type?: string | null;
  test_location?: string | null;
  tester_user_id?: string | null;
  tester_id?: string | null;
  tester_name?: string | null;
  instrument_id?: string | null;
  instrument_serial_number?: string | null;
  calibration_date?: string | null;
  calibration_expiry_date?: string | null;
  ventilation_status?: string | null;
  weather_condition?: string | null;
  o2?: number | null;
  lel?: number | null;
  h2s?: number | null;
  co?: number | null;
  custom_gases?: Record<string, number>;
  result: string;
  result_status?: string | null;
  next_test_due_at?: string | null;
  next_retest_due_at?: string | null;
  retest_status?: string | null;
  validation_details?: { failures?: string[]; missing?: string[] };
  readings?: Array<{ id: string; gas_code: string; gas_name: string; value: number | null; unit: string; min_limit?: number | null; max_limit?: number | null; pass_fail: string }>;
  notes?: string | null;
};
export type PermitConflict = { id: string; conflict_type: string; severity: string; description: string; status: string; conflicting_permit_id?: string | null };
export type PermitWorker = {
  id: string;
  user_id?: string | null;
  worker_name: string;
  worker_type?: string | null;
  company?: string | null;
  employer_company?: string | null;
  contractor_company_id?: string | null;
  trade?: string | null;
  role?: string | null;
  role_on_permit?: string | null;
  phone?: string | null;
  contact_number?: string | null;
  badge_id?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
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
  signature?: string | null;
  notes?: string | null;
};
export type PermitHandover = { id: string; outgoing_shift: string; incoming_shift: string; checklist: Record<string, boolean>; acknowledgement?: string | null; acknowledged_at?: string | null };
export type PermitAttachment = {
  id: string;
  title: string;
  attachment_type?: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  file_size?: number | null;
  storage_key?: string;
  file_key?: string | null;
  description?: string | null;
  related_section?: string | null;
  is_evidence?: boolean;
  is_required?: boolean;
  visibility?: string | null;
  document_id?: string | null;
  document_version_id?: string | null;
  uploaded_by?: string | null;
  uploaded_at?: string | null;
  created_at?: string;
};
export type PermitHistory = {
  id: string;
  event_category?: string | null;
  event_type: string;
  event_title?: string | null;
  title: string;
  description?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  user_role?: string | null;
  related_record_type?: string | null;
  related_record_id?: string | null;
  related_record_number?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  metadata?: Record<string, unknown>;
  is_safety_critical?: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  actor_id?: string | null;
};
export type PermitSignature = {
  id: string;
  signature_type: string;
  signature_role?: string | null;
  signature_purpose?: string | null;
  required_for_status?: string | null;
  status?: string | null;
  signed_by?: string | null;
  signed_at?: string | null;
  role_name?: string | null;
  signature?: string | null;
  signature_id?: string | null;
  ip_address?: string | null;
  comment?: string | null;
  rejection_reason?: string | null;
  correction_required?: string | null;
  revalidation_required?: boolean | null;
  created_at: string;
};

export type PermitDashboard = {
  generatedAt?: string;
  realtime?: { connected: boolean; channel: string; refreshIntervalMs: number };
  currentShift?: { name: string; startAt: string; endAt: string };
  counts: Record<string, number>;
  kpis?: Array<{ key: string; label: string; value: number; tone: string; filter: string; trend?: { value: number; label: string } }>;
  activePermits: Permit[];
  register?: { permits: Permit[]; total: number; page: number; limit: number };
  conflicts: PermitConflict[];
  alerts?: Array<{ id: string; type: string; severity: string; permitId: string; permitNumber: string; message: string; timestamp: string; href: string }>;
  areaOverview?: { units: Array<{ id: string; name: string; code?: string; activePermits: number; conflicts: number; expiringSoon: number; highestRisk: string; areas: Array<{ id: string; name: string; activePermits: number; conflicts: number; highestRisk: string }> }>; mapLocations: Array<Record<string, unknown>> };
  panels?: Record<string, any>;
};

export type PermitSummary = {
  permitId: string;
  permitNumber: string;
  status: string;
  riskLevel: string;
  expiresAt: string;
  isolation: { total: number; confirmed: number; percent: number };
  gasTest: { latest: GasTest | null; dueAt: string | null; status: string };
  workforce: { total: number; onSite: number; maxPersonnel: number | null };
  conflicts: { open: number; total: number };
  signatures: { completed: number; missing: string[] };
  attachments: number;
  handovers: number;
};

export type PermitNewContext = {
  permitTypes: Array<Record<string, unknown>>;
  sites: Array<Record<string, unknown>>;
  units: Array<Record<string, unknown>>;
  areas: Array<Record<string, unknown>>;
  gasThresholds: Array<Record<string, unknown>>;
  contractorCompanies: Array<Record<string, unknown>>;
};

export type CreatePermitInput = {
  siteId: string;
  unitId?: string;
  areaId?: string;
  permitType: string;
  title: string;
  workDescription: string;
  riskLevel?: string;
  equipmentId?: string;
  location?: string;
  jobArea?: string;
  plannedStartAt: string;
  plannedEndAt: string;
  requiredControls?: Record<string, unknown>;
  typeSpecificData?: Record<string, unknown>;
  maxPersonnel?: number;
};

export const ptwService = {
  list: (params?: Record<string, string>) => api.get('/ptw', { params }).then(unwrap<Permit[]>),
  dashboard: () => api.get('/ptw/dashboard').then(unwrap<PermitDashboard>),
  newContext: () => api.get('/ptw/new/context').then(unwrap<PermitNewContext>),
  equipmentSearch: (search = '') => api.get('/ptw/equipment-search', { params: { search } }).then(unwrap<Array<{ id: string; tag: string; name: string; type: string; criticality?: string; safetyCritical?: boolean; siteId?: string; unitId?: string; areaId?: string; unit?: { name?: string }; area?: { name?: string } }>>),
  get: (id: string) => api.get(`/ptw/${id}`).then(unwrap<Permit>),
  summary: (id: string) => api.get(`/ptw/${id}/summary`).then(unwrap<PermitSummary>),
  create: (input: CreatePermitInput) => api.post('/ptw', input).then(unwrap<Permit>),
  update: (id: string, input: Partial<CreatePermitInput>) => api.patch(`/ptw/${id}`, input).then(unwrap<Permit>),
  submit: (id: string) => api.post(`/ptw/${id}/submit`).then(unwrap<Permit>),
  approve: (id: string) => api.post(`/ptw/${id}/approve`).then(unwrap<Permit>),
  issue: (id: string) => api.post(`/ptw/${id}/issue`, {}).then(unwrap<Permit>),
  activate: (id: string) => api.post(`/ptw/${id}/activate`).then(unwrap<Permit>),
  suspend: (id: string, reason: string) => api.post(`/ptw/${id}/suspend`, { reason }).then(unwrap<Permit>),
  extend: (id: string, newExpiryAt: string, reason: string) => api.post(`/ptw/${id}/extend`, { newExpiryAt, reason }).then(unwrap<Permit>),
  close: (id: string, notes?: string) => api.post(`/ptw/${id}/close`, { notes }).then(unwrap<Permit>),
  cancel: (id: string, reason: string) => api.post(`/ptw/${id}/cancel`, { reason }).then(unwrap<Permit>),
  addGasTest: (id: string, input: Partial<GasTest>) => api.post(`/ptw/${id}/gas-tests`, input).then(unwrap<GasTest>),
  gasTests: (id: string) => api.get(`/ptw/${id}/gas-tests`).then(unwrap<GasTest[]>),
  updateGasTest: (id: string, gasTestId: string, input: Partial<GasTest>) => api.patch(`/ptw/${id}/gas-tests/${gasTestId}`, input).then(unwrap<GasTest>),
  addIsolation: (id: string, input: { energyType: string; sourceDescription: string; isolationPoint: string; valveTag?: string; requiredPosition?: string; normalPosition?: string; lockNumber?: string; lockHolder?: string }) => api.post(`/ptw/${id}/isolation`, input).then(unwrap<PermitIsolation>),
  isolation: (id: string) => api.get(`/ptw/${id}/isolation`).then(unwrap<PermitIsolation[]>),
  updateIsolation: (id: string, isolationId: string, input: Partial<{ energyType: string; sourceDescription: string; isolationPoint: string; valveTag: string; requiredPosition: string; normalPosition: string; lockNumber: string; lockHolder: string; notes: string }>) => api.patch(`/ptw/${id}/isolation/${isolationId}`, input).then(unwrap<PermitIsolation>),
  deleteIsolation: (id: string, isolationId: string) => api.delete(`/ptw/${id}/isolation/${isolationId}`).then(unwrap<{ deleted: boolean; id: string }>),
  confirmIsolation: (id: string, isolationId: string) => api.patch(`/ptw/${id}/isolation/${isolationId}/confirm`, {}).then(unwrap<PermitIsolation>),
  verifyIsolation: (id: string, isolationId: string) => api.patch(`/ptw/${id}/isolation/${isolationId}/verify`, {}).then(unwrap<PermitIsolation>),
  deisolate: (id: string) => api.post(`/ptw/${id}/de-isolation`).then(unwrap<{ count: number }>),
  addWorkforce: (id: string, input: { workerName: string; workerType?: string; company?: string; employerCompany?: string; contractorCompanyId?: string; trade?: string; role?: string; roleOnPermit?: string; phone?: string; contactNumber?: string; badgeId?: string; emergencyContactName?: string; emergencyContactPhone?: string; signedBriefing?: boolean; briefingCompleted?: boolean; briefingRequired?: boolean }) => api.post(`/ptw/${id}/workforce`, input).then(unwrap<PermitWorker>),
  workforce: (id: string) => api.get(`/ptw/${id}/workforce`).then(unwrap<PermitWorker[]>),
  updateWorkforce: (id: string, workerId: string, input: Partial<{ workerName: string; workerType: string; company: string; employerCompany: string; contractorCompanyId: string; trade: string; role: string; roleOnPermit: string; phone: string; contactNumber: string; badgeId: string; emergencyContactName: string; emergencyContactPhone: string; signedBriefing: boolean; briefingCompleted: boolean; briefingRequired: boolean; signature: string }>) => api.patch(`/ptw/${id}/workforce/${workerId}`, input).then(unwrap<PermitWorker>),
  deleteWorkforce: (id: string, workerId: string) => api.delete(`/ptw/${id}/workforce/${workerId}`).then(unwrap<{ deleted: boolean; id: string }>),
  signIn: (id: string, workerId: string) => api.post(`/ptw/${id}/workforce/${workerId}/sign-in`).then(unwrap<PermitWorker>),
  signOut: (id: string, workerId: string) => api.post(`/ptw/${id}/workforce/${workerId}/sign-out`).then(unwrap<PermitWorker>),
  handover: (id: string, input: { outgoingShift: string; incomingShift: string; acknowledgement?: string; checklist?: Record<string, boolean> }) => api.post(`/ptw/${id}/handover`, input).then(unwrap<PermitHandover>),
  handovers: (id: string) => api.get(`/ptw/${id}/handover`).then(unwrap<PermitHandover[]>),
  acknowledgeHandover: (id: string, handoverId: string) => api.post(`/ptw/${id}/handover/${handoverId}/acknowledge`).then(unwrap<PermitHandover>),
  conflicts: (id: string) => api.get(`/ptw/${id}/conflicts`).then(unwrap<PermitConflict[]>),
  checkConflicts: (id: string) => api.post(`/ptw/${id}/conflicts/check`).then(unwrap<PermitConflict[]>),
  overrideConflict: (id: string, conflictId: string, reason: string) => api.post(`/ptw/${id}/conflicts/${conflictId}/override`, { reason }).then(unwrap<PermitConflict>),
  closureChecklist: (id: string, items: Record<string, boolean>) => api.post(`/ptw/${id}/closure-checklist`, { items }).then(unwrap<{ id: string }>),
  addAttachment: (id: string, input: { file?: File; title: string; fileName: string; mimeType: string; sizeBytes?: number; storageKey?: string }) => {
    if (input.file) {
      const form = new FormData();
      form.append('file', input.file);
      form.append('title', input.title);
      form.append('fileName', input.fileName);
      form.append('mimeType', input.mimeType);
      if (input.sizeBytes !== undefined) form.append('sizeBytes', String(input.sizeBytes));
      if (input.storageKey) form.append('storageKey', input.storageKey);
      return api.post(`/ptw/${id}/attachments`, form).then(unwrap<PermitAttachment>);
    }
    return api.post(`/ptw/${id}/attachments`, input).then(unwrap<PermitAttachment>);
  },
  deleteAttachment: (id: string, attachmentId: string) => api.delete(`/ptw/${id}/attachments/${attachmentId}`).then(unwrap<{ deleted: boolean; id: string }>),
  attachments: (id: string) => api.get(`/ptw/${id}/attachments`).then(unwrap<PermitAttachment[]>),
  attachmentUrl: (id: string, attachmentId: string) => `${api.defaults.baseURL}/ptw/${id}/attachments/${attachmentId}/download`,
  addSignature: (id: string, input: { signatureType: string; signature?: string; roleName?: string; ipAddress?: string }) => api.post(`/ptw/${id}/signatures`, input).then(unwrap<PermitSignature>),
  signatures: (id: string) => api.get(`/ptw/${id}/signatures`).then(unwrap<PermitSignature[]>),
  history: (id: string) => api.get(`/ptw/${id}/history`).then(unwrap<PermitHistory[]>),
  clone: (id: string) => api.post(`/ptw/${id}/clone`).then(unwrap<Permit>),
  createMocAction: (id: string) => api.post(`/ptw/${id}/create-moc`).then(unwrap<{ id: string }>),
  saveTemplate: (id: string) => api.post(`/ptw/${id}/save-template`).then(unwrap<{ id: string }>),
  map: () => api.get('/ptw/map').then(unwrap<any>),
  downloadCertificate: (id: string) => api.get(`/ptw/${id}/certificate`, { responseType: 'blob' }).then((response) => response.data as Blob),
  downloadIsolationCertificate: (id: string) => api.get(`/ptw/${id}/isolation-certificate`, { responseType: 'blob' }).then((response) => response.data as Blob),
  certificateUrl: (id: string) => `${api.defaults.baseURL}/ptw/${id}/certificate`,
  isolationCertificateUrl: (id: string) => `${api.defaults.baseURL}/ptw/${id}/isolation-certificate`
};
