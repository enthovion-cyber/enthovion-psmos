export type MiApprovalStatus = 'Draft' | 'Submitted' | 'Pending Approval' | 'In Review' | 'Approved' | 'Approved With Conditions' | 'Rejected' | 'Returned for Correction' | 'More Information Requested' | 'Delegated' | 'Escalated' | 'Cancelled' | 'Superseded' | 'Completed' | 'Expired / Overdue';

export type MiApprovalInstance = {
  id: string;
  company_id: string;
  site_id: string;
  approval_number: string;
  source_module: string;
  source_record_id: string;
  source_record_number?: string | null;
  equipment_id?: string | null;
  approval_type: string;
  current_stage: string;
  status: MiApprovalStatus | string;
  priority: string;
  risk_level?: string | null;
  safety_critical: boolean;
  psm_critical: boolean;
  readiness_impact: boolean;
  startup_blocker: boolean;
  e_signature_required: boolean;
  submitted_by: string;
  submitted_at: string;
  due_at?: string | null;
  completed_at?: string | null;
  workflow_instance_id?: string | null;
  stale_approval?: boolean;
  last_validation_status?: string;
  last_action?: string | null;
  created_at: string;
  updated_at: string;
};

export type MiApprovalStage = {
  id: string;
  approval_instance_id: string;
  stage_number: number;
  stage_name: string;
  approver_role?: string | null;
  approver_user_id?: string | null;
  delegated_to_user_id?: string | null;
  status: string;
  due_at?: string | null;
  acted_by?: string | null;
  acted_at?: string | null;
  action?: string | null;
  comments?: string | null;
  e_signature_id?: string | null;
};

export type MiApprovalValidation = {
  id: string;
  validation_key: string;
  validation_title: string;
  validation_status: string;
  severity: string;
  message: string;
  override_allowed: boolean;
  overridden_by?: string | null;
  override_reason?: string | null;
};

export type MiApprovalComment = {
  id: string;
  comment_type: string;
  comment_text: string;
  internal_only: boolean;
  required_action: boolean;
  created_by: string;
  created_at: string;
};

export type MiApprovalCondition = {
  id: string;
  condition_text: string;
  owner_user_id?: string | null;
  due_date?: string | null;
  status: string;
  linked_action_id?: string | null;
  created_by: string;
  created_at: string;
  closed_at?: string | null;
};

export type MiApprovalRule = {
  id: string;
  rule_name: string;
  source_module: string;
  record_type?: string | null;
  risk_level?: string | null;
  safety_critical?: boolean | null;
  psm_critical?: boolean | null;
  readiness_impact?: boolean | null;
  startup_blocker?: boolean | null;
  approval_chain_json: Array<Record<string, unknown>>;
  e_signature_required: boolean;
  due_duration_value?: number | null;
  due_duration_unit?: string | null;
  active: boolean;
};

export type MiApprovalDashboardResponse = {
  rows: MiApprovalInstance[];
  page: number;
  limit: number;
  total: number;
  summary: Record<string, number>;
  savedViews: string[];
  lastUpdated: string;
};

export type MiApprovalDetailResponse = {
  approval: MiApprovalInstance;
  source: Record<string, unknown>;
  stages: MiApprovalStage[];
  validations: MiApprovalValidation[];
  changeSummary: Array<Record<string, unknown>>;
  comments: MiApprovalComment[];
  conditions: MiApprovalCondition[];
  history: Array<Record<string, unknown>>;
  documents: { evaluations?: Array<Record<string, unknown>>; links?: Array<Record<string, unknown>>; missing?: Array<Record<string, unknown>> };
  signatures: Array<Record<string, unknown>>;
  readOnly: boolean;
  permissionState: { canReview: boolean; isRequester: boolean; disabledReason?: string | null };
};
