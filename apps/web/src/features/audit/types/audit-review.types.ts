export type AuditApprovalPackage = {
  id: string;
  package_number?: string | null;
  package_title: string;
  package_status: string;
  source_module: string;
  source_object_type?: string | null;
  source_record_id: string;
  source_record_number?: string | null;
  source_record_title?: string | null;
  source_record_status?: string | null;
  validation_status?: string | null;
  stale_status?: string | null;
  stale_reason?: string | null;
  due_at?: string | null;
  submitted_by?: string | null;
  submitted_at?: string | null;
  safety_critical?: boolean | null;
  regulatory_critical?: boolean | null;
  psm_critical?: boolean | null;
  report_ready?: boolean | null;
  locked_source?: boolean | null;
  overdue?: boolean | null;
  participant_count?: number;
  decision_count?: number;
  condition_count?: number;
  open_condition_count?: number;
  validation_failure_count?: number;
  esignature_pending_count?: number;
  e_signature_required?: boolean;
};

export type AuditApprovalSummary = {
  total: number;
  pending: number;
  overdue: number;
  stale: number;
  validationFailures: number;
  esignaturePending: number;
  approved: number;
  rejected: number;
  returned: number;
  approvedWithConditions: number;
  completed: number;
  reportReady: number;
  safetyCritical: number;
  statuses?: Array<{ key: string; label: string; count: number }>;
};

export type AuditApprovalList = {
  rows: AuditApprovalPackage[];
  total: number;
  page: number;
  limit: number;
  summary: AuditApprovalSummary;
};

export type AuditApprovalDashboard = {
  summary: AuditApprovalSummary;
  inboxPreview: AuditApprovalPackage[];
  pendingByModule: Array<{ key: string; label: string; count: number }>;
  overdueApprovals: AuditApprovalPackage[];
  stalePackages: AuditApprovalPackage[];
  validationFailures: AuditApprovalPackage[];
  esignaturePending: AuditApprovalPackage[];
  safetyCriticalApprovals: AuditApprovalPackage[];
  regulatoryCriticalApprovals: AuditApprovalPackage[];
  workloadByReviewer: Array<{ key: string; label: string; count: number }>;
  cycleTimeByModule: Array<{ key: string; label: string; count: number; averageDays?: number }>;
  returnedRejectedTrends: AuditApprovalPackage[];
  recentApprovals: AuditApprovalPackage[];
  recentRejections: AuditApprovalPackage[];
  reportReady: AuditApprovalPackage[];
  rules: AuditReviewRule[];
};

export type AuditApprovalDetail = {
  approval: AuditApprovalPackage;
  source: Record<string, unknown>;
  snapshot: Record<string, unknown>;
  evidence: Record<string, unknown>[];
  validation: Record<string, unknown>[];
  validationChecks: Record<string, unknown>[];
  stages: Record<string, unknown>[];
  participants: Record<string, unknown>[];
  decisions: Record<string, unknown>[];
  esignatures: Record<string, unknown>[];
  conditions: Record<string, unknown>[];
  history: Record<string, unknown>[];
  escalations: Record<string, unknown>[];
  staleness: Record<string, unknown>[];
  readiness: { status: string; blockers: Array<{ title: string; message: string; severity: string }>; readyForApproval: boolean; reportReady: boolean; lockedSource: boolean };
};

export type AuditReviewRule = {
  id: string;
  rule_code?: string | null;
  rule_title: string;
  rule_status: string;
  source_module: string;
  source_object_type: string;
  trigger_event: string;
  e_signature_required?: boolean | null;
  auto_lock_on_approval?: boolean | null;
  auto_mark_report_ready?: boolean | null;
};
