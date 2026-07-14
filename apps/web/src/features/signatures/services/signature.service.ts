import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type SignatureProfile = {
  id?: string;
  full_name?: string;
  job_title?: string | null;
  department_name?: string | null;
  signature_method?: 'Draw' | 'Type' | 'Upload' | 'Initials';
  signature_text?: string | null;
  signature_image_url?: string | null;
  signature_vector_json?: Record<string, unknown> | null;
  initials?: string | null;
  style_config?: Record<string, unknown> | null;
  status?: string;
  verified_at?: string | null;
  updated_at?: string;
};

export type SignatureRequirement = {
  id: string;
  module_name: string;
  record_type: string;
  action_type: string;
  signature_role: string;
  required_permission?: string | null;
  required: boolean;
  sequence_order: number;
  can_delegate: boolean;
  requires_independent_signer: boolean;
  blocks_action_until_signed: boolean;
  declaration_text: string;
};

export type ElectronicSignature = {
  id: string;
  module_name: string;
  record_type: string;
  record_id: string;
  record_number?: string | null;
  action_type: string;
  signature_role: string;
  signer_full_name: string;
  signer_job_title?: string | null;
  signer_department?: string | null;
  signed_at: string;
  status: 'Signed' | 'Rejected' | 'Revoked By System' | 'Superseded';
  declaration_text?: string | null;
  signature_snapshot_method: string;
  signature_snapshot_text?: string | null;
  signature_snapshot_image_url?: string | null;
  signature_snapshot_vector_json?: Record<string, unknown> | null;
  signature_hash: string;
  rejection_reason?: string | null;
};

export type SignatureContext = {
  moduleName: string;
  recordType: string;
  recordId: string;
  recordNumber?: string;
  actionType: string;
  signatureRole: string;
  declarationText?: string;
  metadata?: Record<string, unknown>;
};

export type SaveSignatureProfileInput = {
  fullName: string;
  jobTitle?: string;
  departmentName?: string;
  signatureMethod: 'Draw' | 'Type' | 'Upload' | 'Initials';
  signatureText?: string;
  signatureImageUrl?: string;
  signatureVectorJson?: Record<string, unknown>;
  initials?: string;
  styleConfig?: Record<string, unknown>;
};

export type SignSignatureInput = SignatureContext & {
  authMethod: 'password' | 'pin';
  usernameReentry: string;
  passwordOrPin: string;
  comment?: string;
};

export type RejectSignatureInput = SignatureContext & { rejectionReason: string };

export const signatureService = {
  myProfile: () => api.get('/users/me/signature-profile').then(unwrap<SignatureProfile | null>),
  saveProfile: (input: SaveSignatureProfileInput) => api.post('/users/me/signature-profile', input).then(unwrap<SignatureProfile>),
  updateProfile: (input: SaveSignatureProfileInput) => api.patch('/users/me/signature-profile', input).then(unwrap<SignatureProfile>),
  verifyProfile: () => api.post('/users/me/signature-profile/verify').then(unwrap<SignatureProfile>),
  disableProfile: () => api.post('/users/me/signature-profile/disable').then(unwrap<SignatureProfile>),
  versions: () => api.get('/users/me/signature-profile/versions').then(unwrap<SignatureProfile[]>),
  setPin: (pin: string, password?: string) => api.post('/users/me/signature-pin/set', { pin, password }).then(unwrap<any>),
  changePin: (currentPin: string, newPin: string) => api.post('/users/me/signature-pin/change', { currentPin, newPin }).then(unwrap<any>),
  verifyPin: (pin: string) => api.post('/users/me/signature-pin/verify', { pin }).then(unwrap<{ verified: boolean }>),
  requirements: (params?: { moduleName?: string; recordType?: string; actionType?: string; siteId?: string }) => api.get('/signatures/requirements', { params }).then(unwrap<SignatureRequirement[]>),
  forRecord: (context: Pick<SignatureContext, 'moduleName' | 'recordType' | 'recordId'>) => api.get('/signatures/for-record', { params: { module_name: context.moduleName, record_type: context.recordType, record_id: context.recordId } }).then(unwrap<ElectronicSignature[]>),
  sign: (context: SignSignatureInput) => api.post('/signatures/sign', context).then(unwrap<ElectronicSignature>),
  reject: (context: RejectSignatureInput) => api.post('/signatures/reject', context).then(unwrap<ElectronicSignature>),
  validateBeforeAction: (context: Pick<SignatureContext, 'moduleName' | 'recordType' | 'recordId' | 'actionType'>) => api.post('/signatures/validate-before-action', context).then(unwrap<{ valid: boolean; missing: string[]; requirements: SignatureRequirement[]; signatures: ElectronicSignature[] }>)
};
