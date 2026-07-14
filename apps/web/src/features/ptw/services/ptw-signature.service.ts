import { api } from '@/services/api';
import type { RejectSignatureValues, SignatureRequirementValues, SignSignatureValues } from '../schemas/signature.schema';

function unwrap<T>(response: { data: { data: T } }) { return response.data.data; }

export type PermitSignatureStatus = 'Not Required' | 'Pending' | 'Signed' | 'Rejected' | 'Expired' | 'Revalidation Required' | 'Skipped by Rule' | 'Cancelled' | string;

export type PermitSignature = {
  id: string;
  permit_id: string;
  signature_role?: string | null;
  signature_type?: string | null;
  signature_purpose?: string | null;
  required_for_status?: string | null;
  assigned_user_id?: string | null;
  assigned_role_id?: string | null;
  status: PermitSignatureStatus;
  signed_by?: string | null;
  signed_at?: string | null;
  signature_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  comment?: string | null;
  rejection_reason?: string | null;
  correction_required?: string | null;
  expires_at?: string | null;
  revalidation_required?: boolean;
  created_at?: string | null;
};

export type SignatureSummary = {
  totalRequired: number;
  completed: number;
  pending: number;
  rejected: number;
  completionPercent: number;
  status: string;
  lifecycleBlocked: boolean;
  blockers: string[];
};

export type SignatureHistory = {
  id: string;
  signature_id?: string | null;
  event_type: string;
  description: string;
  user_id?: string | null;
  before_value?: unknown;
  after_value?: unknown;
  created_at: string;
};

export type SignatureRequirement = {
  id: string;
  permit_type?: string | null;
  risk_level?: string | null;
  area_classification?: string | null;
  equipment_criticality?: string | null;
  signature_role: string;
  signature_purpose: string;
  required_for_status: string;
  assigned_role_id?: string | null;
  is_required: boolean;
  condition_rule?: Record<string, unknown> | null;
  expires_on_extension: boolean;
  expires_on_suspension?: boolean;
  requires_revalidation: boolean;
  is_active: boolean;
  created_at?: string | null;
};

export const ptwSignatureService = {
  list: (permitId: string) => api.get(`/ptw/${permitId}/signatures`).then(unwrap<PermitSignature[]>),
  summary: (permitId: string) => api.get(`/ptw/${permitId}/signatures/summary`).then(unwrap<SignatureSummary>),
  history: (permitId: string) => api.get(`/ptw/${permitId}/signatures/history`).then(unwrap<SignatureHistory[]>),
  generate: (permitId: string) => api.post(`/ptw/${permitId}/signatures/generate-requirements`).then(unwrap<PermitSignature[]>),
  sign: (permitId: string, signatureId: string, input: SignSignatureValues) => api.post(`/ptw/${permitId}/signatures/${signatureId}/sign`, { ...input, userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined }).then(unwrap<PermitSignature>),
  reject: (permitId: string, signatureId: string, input: RejectSignatureValues) => api.post(`/ptw/${permitId}/signatures/${signatureId}/reject`, input).then(unwrap<PermitSignature>),
  revalidate: (permitId: string, signatureId: string) => api.post(`/ptw/${permitId}/signatures/${signatureId}/revalidate`).then(unwrap<PermitSignature>),
  requirements: () => api.get('/ptw/signature-requirements').then(unwrap<SignatureRequirement[]>),
  createRequirement: (input: SignatureRequirementValues) => api.post('/ptw/signature-requirements', input).then(unwrap<SignatureRequirement>),
  updateRequirement: (requirementId: string, input: SignatureRequirementValues) => api.patch(`/ptw/signature-requirements/${requirementId}`, input).then(unwrap<SignatureRequirement>),
  deleteRequirement: (requirementId: string) => api.delete(`/ptw/signature-requirements/${requirementId}`).then(unwrap<SignatureRequirement>)
};
