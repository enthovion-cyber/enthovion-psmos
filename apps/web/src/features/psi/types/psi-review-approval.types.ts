export type PsiApprovalStatus = 'Draft' | 'Ready to Submit' | 'Submitted' | 'Validation Failed' | 'Under Review' | 'Returned' | 'Rejected' | 'Approved' | 'Approved Current' | 'Superseded' | 'Reopened' | 'Archived' | 'Escalated' | 'Delegated' | 'Completed';

export type PsiApprovalRequest = {
  id: string;
  company_id?: string | null;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  psi_module?: string | null;
  psi_record_id?: string | null;
  psi_record_title?: string | null;
  approval_type?: string | null;
  approval_status?: PsiApprovalStatus | string | null;
  current_stage_id?: string | null;
  current_stage_name?: string | null;
  current_stage_required_role?: string | null;
  current_stage_assigned_user_id?: string | null;
  criticality?: string | null;
  safety_critical?: boolean | null;
  psm_critical?: boolean | null;
  moc_required?: boolean | null;
  pssr_blocker?: boolean | null;
  completeness_status?: string | null;
  conflict_status?: string | null;
  validation_status?: string | null;
  submitted_by?: string | null;
  submitted_at?: string | null;
  submitter_note?: string | null;
  due_date?: string | null;
  final_decision?: string | null;
  final_decision_by?: string | null;
  final_decision_at?: string | null;
  stale_approval?: boolean | null;
  stale_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PsiApprovalStage = {
  id: string;
  approval_request_id?: string;
  stage_order?: number;
  stage_name?: string | null;
  required_role?: string | null;
  assigned_user_id?: string | null;
  stage_status?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  decision?: string | null;
  decision_comment?: string | null;
  esign_required?: boolean | null;
};

export type PsiApprovalValidationResult = {
  id: string;
  validation_key?: string | null;
  validation_title?: string | null;
  validation_status?: string | null;
  severity?: string | null;
  blocking?: boolean | null;
  message?: string | null;
  source_module?: string | null;
};

export type PsiApprovalSnapshot = {
  id: string;
  snapshot_type?: string | null;
  snapshot_status?: string | null;
  before_json?: Record<string, unknown> | null;
  after_json?: Record<string, unknown> | null;
  diff_json?: Record<string, unknown> | null;
  completeness_snapshot_json?: Record<string, unknown> | null;
  conflict_snapshot_json?: Record<string, unknown> | null;
  document_snapshot_json?: Record<string, unknown> | null;
  linked_record_snapshot_json?: Record<string, unknown> | null;
  created_at?: string | null;
};

export type PsiApprovalComment = {
  id: string;
  comment_type?: string | null;
  comment_text?: string | null;
  internal_only?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
};

export type PsiApprovalHistoryEvent = {
  id: string;
  event_type?: string | null;
  event_title?: string | null;
  event_description?: string | null;
  actor_user_id?: string | null;
  reason?: string | null;
  created_at?: string | null;
};

export type PsiApprovalDashboard = {
  rows: PsiApprovalRequest[];
  page?: number;
  limit?: number;
  total?: number;
  summary?: Record<string, number | string | null>;
  charts?: Record<string, Record<string, number>>;
  recentApprovals?: PsiApprovalRequest[];
  recentReturns?: PsiApprovalRequest[];
  upcomingDeadlines?: PsiApprovalRequest[];
  savedViews?: Array<{ id: string; name: string; href: string }>;
  lastUpdated?: string;
};

export type PsiApprovalDetail = {
  approval: PsiApprovalRequest;
  source?: Record<string, unknown> | null;
  package?: Record<string, unknown> | null;
  stages?: PsiApprovalStage[];
  participants?: Record<string, unknown>[];
  validationResults?: PsiApprovalValidationResult[];
  snapshots?: PsiApprovalSnapshot[];
  latestSnapshot?: PsiApprovalSnapshot | null;
  diff?: Record<string, unknown> | null;
  comments?: PsiApprovalComment[];
  history?: PsiApprovalHistoryEvent[];
  escalations?: Record<string, unknown>[];
  signatures?: Record<string, unknown>[];
  readOnly?: boolean;
  permissionState?: { canApprove?: boolean; canReject?: boolean; canReturn?: boolean; canComment?: boolean; disabledReasons?: string[] };
};

export type PsiApprovalRule = {
  id: string;
  rule_name?: string | null;
  psi_module?: string | null;
  record_type?: string | null;
  applicability_scope?: string | null;
  criticality_filter?: string | null;
  completeness_threshold?: number | null;
  required_stages_json?: Array<Record<string, unknown>> | null;
  required_esignature?: boolean | null;
  allow_delegate?: boolean | null;
  allow_override?: boolean | null;
  allow_waiver?: boolean | null;
  sla_hours?: number | null;
  active?: boolean | null;
};

export type PsiApprovalPaged = {
  rows: PsiApprovalRequest[];
  page?: number;
  limit?: number;
  total?: number;
  summary?: Record<string, number | string | null>;
  savedViews?: Array<{ id: string; name: string; href: string }>;
};
