import { api } from '@/services/api';
import type { IsolationPointValues } from '../schemas/isolation.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type PermitIsolationPoint = {
  id: string;
  permit_id: string;
  company_id?: string | null;
  site_id: string;
  equipment_id?: string | null;
  equipment_tag?: string | null;
  energy_type: string;
  isolation_point: string;
  isolation_point_tag?: string | null;
  isolation_point_description?: string | null;
  source_description?: string | null;
  valve_tag?: string | null;
  breaker_tag?: string | null;
  blind_spade_number?: string | null;
  required_position?: string | null;
  normal_position?: string | null;
  current_position?: string | null;
  lock_number?: string | null;
  lock_holder?: string | null;
  lock_holder_name?: string | null;
  lock_holder_user_id?: string | null;
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
  created_at?: string;
  updated_at?: string;
};

export type PermitIsolationSummary = {
  isolationRequired: boolean;
  total: number;
  confirmed: number;
  verified: number;
  deisolated: number;
  removalVerified: number;
  completionPercent: number;
  deIsolationPercent: number;
  status: string;
  isolationAuthority?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  certificate?: PermitIsolationCertificate | null;
  activationBlocked: boolean;
  blockers: string[];
};

export type PermitIsolationCertificate = {
  id: string;
  certificate_number: string;
  file_url?: string | null;
  file_key?: string | null;
  generated_by?: string | null;
  generated_at: string;
  version: number;
  status: string;
};

export type PermitIsolationHistory = {
  id: string;
  isolation_point_id?: string | null;
  event_type: string;
  description: string;
  user_id?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  created_at: string;
};

export const ptwIsolationService = {
  list: (permitId: string) => api.get(`/ptw/${permitId}/isolation`).then(unwrap<PermitIsolationPoint[]>),
  summary: (permitId: string) => api.get(`/ptw/${permitId}/isolation/summary`).then(unwrap<PermitIsolationSummary>),
  history: (permitId: string) => api.get(`/ptw/${permitId}/isolation/history`).then(unwrap<PermitIsolationHistory[]>),
  certificate: (permitId: string) => api.get(`/ptw/${permitId}/isolation-certificate/record`).then(unwrap<PermitIsolationCertificate | null>),
  create: (permitId: string, input: IsolationPointValues) => api.post(`/ptw/${permitId}/isolation`, toApi(input)).then(unwrap<PermitIsolationPoint>),
  update: (permitId: string, isolationId: string, input: Partial<IsolationPointValues>) => api.patch(`/ptw/${permitId}/isolation/${isolationId}`, toApi(input)).then(unwrap<PermitIsolationPoint>),
  remove: (permitId: string, isolationId: string) => api.delete(`/ptw/${permitId}/isolation/${isolationId}`).then(unwrap<{ deleted: boolean; id: string }>),
  importFromEquipment: (permitId: string) => api.post(`/ptw/${permitId}/isolation/import-from-equipment`).then(unwrap<{ imported: number; rows: PermitIsolationPoint[]; message?: string }>),
  confirm: (permitId: string, isolationId: string, signature?: string) => api.patch(`/ptw/${permitId}/isolation/${isolationId}/confirm`, { signature }).then(unwrap<PermitIsolationPoint>),
  verify: (permitId: string, isolationId: string) => api.patch(`/ptw/${permitId}/isolation/${isolationId}/verify`, {}).then(unwrap<PermitIsolationPoint>),
  startDeIsolation: (permitId: string) => api.post(`/ptw/${permitId}/de-isolation/start`).then(unwrap<{ count: number; rows: PermitIsolationPoint[] }>),
  deIsolate: (permitId: string, isolationId: string, signature?: string) => api.patch(`/ptw/${permitId}/isolation/${isolationId}/de-isolate`, { signature }).then(unwrap<PermitIsolationPoint>),
  removalVerify: (permitId: string, isolationId: string, signature?: string) => api.patch(`/ptw/${permitId}/isolation/${isolationId}/removal-verify`, { signature }).then(unwrap<PermitIsolationPoint>),
  generateCertificate: (permitId: string) => api.post(`/ptw/${permitId}/isolation-certificate`).then(unwrap<PermitIsolationCertificate>),
  downloadCertificate: (permitId: string) => api.get(`/ptw/${permitId}/isolation-certificate`, { responseType: 'blob' }).then((response) => response.data as Blob)
};

function toApi(input: Partial<IsolationPointValues>) {
  return {
    ...input,
    isolationPoint: input.isolationPoint || input.isolationPointTag,
    sourceDescription: input.sourceDescription || input.isolationPointDescription || input.isolationPoint
  };
}
