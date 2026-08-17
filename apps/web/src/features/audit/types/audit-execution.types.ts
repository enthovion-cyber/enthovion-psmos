export type AuditExecutionRow = {
  id: string;
  company_id: string;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  program_id?: string | null;
  plan_id?: string | null;
  checklist_id?: string | null;
  execution_code: string;
  execution_title: string;
  execution_status: string;
  progress_status: string;
  evidence_status: string;
  field_finding_status?: string | null;
  audit_type?: string | null;
  criticality?: string | null;
  execution_mode: string;
  lead_auditor_user_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  progress_percent: number;
  total_items: number;
  completed_items: number;
  pending_items: number;
  non_compliant_items: number;
  evidence_required_count: number;
  evidence_missing_count: number;
  field_findings_count: number;
  critical_findings_count: number;
  ready_for_finding_register: boolean;
  created_at: string;
  updated_at: string;
};

export type AuditExecutionSection = {
  id: string;
  execution_id: string;
  section_code: string;
  section_title: string;
  section_status: string;
  progress_percent: number;
  total_items: number;
  pending_items: number;
  non_compliant_items: number;
  evidence_missing_count: number;
};

export type AuditExecutionItem = {
  id: string;
  execution_id: string;
  execution_section_id: string;
  item_code: string;
  item_text: string;
  question_type: string;
  response_type: string;
  required_response: boolean;
  mandatory_evidence: boolean;
  may_create_finding: boolean;
  safety_critical: boolean;
  regulatory_critical: boolean;
  psm_critical: boolean;
  expected_evidence?: string | null;
  guidance_text?: string | null;
  not_applicable_allowed: boolean;
  comments_required: boolean;
  attachments_required: boolean;
  item_status: string;
};

export type AuditExecutionResponse = {
  id: string;
  execution_id: string;
  execution_item_id: string;
  response_status: string;
  compliance_result: string;
  response_text?: string | null;
  comment?: string | null;
  na_justification?: string | null;
  evidence_status: string;
  responded_at?: string | null;
};

export type AuditExecutionEvidence = {
  id: string;
  execution_id: string;
  execution_item_id?: string | null;
  field_finding_id?: string | null;
  evidence_title: string;
  evidence_type: string;
  evidence_status: string;
  confidentiality_level?: string | null;
  created_at: string;
  removed_at?: string | null;
};

export type AuditFieldNote = {
  id: string;
  execution_id: string;
  note_title: string;
  note_type: string;
  note_text: string;
  criticality?: string | null;
  visibility?: string | null;
  converted_to_finding: boolean;
  created_at: string;
};

export type AuditFieldFinding = {
  id: string;
  execution_id: string;
  finding_title: string;
  finding_type: string;
  finding_description: string;
  criticality: string;
  immediate_concern: boolean;
  stop_work_recommended: boolean;
  field_finding_status: string;
  converted_to_finding_register: boolean;
  created_at: string;
  cancelled_at?: string | null;
};

export type AuditExecutionEngagement = {
  id: string;
  execution_id: string;
  interview_title?: string;
  walkthrough_title?: string;
  summary?: string | null;
  observations?: string | null;
  follow_up_required?: boolean;
  created_at: string;
};

export type AuditExecutionReadiness = {
  readiness_status: string;
  ready_for_completion: boolean;
  ready_for_finding_register: boolean;
  mandatory_items_answered: boolean;
  required_comments_complete: boolean;
  required_evidence_complete: boolean;
  na_justifications_complete: boolean;
  safety_critical_items_reviewed: boolean;
  validation_errors_resolved: boolean;
  lead_auditor_review_complete: boolean;
  missing_items_json?: string[] | null;
  warnings_json?: string[] | null;
};

export type AuditExecutionDetail = {
  execution: AuditExecutionRow;
  sections: AuditExecutionSection[];
  items: AuditExecutionItem[];
  responses: AuditExecutionResponse[];
  evidence: AuditExecutionEvidence[];
  notes: AuditFieldNote[];
  findings: AuditFieldFinding[];
  interviews: AuditExecutionEngagement[];
  walkthroughs: AuditExecutionEngagement[];
  readiness: AuditExecutionReadiness;
  activity: Record<string, any>[];
  history: Record<string, any>[];
  progress: Record<string, any>;
};

export type AuditExecutionSummary = {
  total: number;
  readyToStart: number;
  inProgress: number;
  paused: number;
  completed: number;
  blocked: number;
  pendingResponses: number;
  pendingEvidence: number;
  fieldFindings: number;
  criticalFindings: number;
  readyForFindingRegister: number;
};

export type AuditExecutionRegister = {
  rows: AuditExecutionRow[];
  total: number;
  page: number;
  limit: number;
  summary: AuditExecutionSummary;
};

export type AuditExecutionDashboard = {
  summary: AuditExecutionSummary;
  byStatus: { label: string; value: number }[];
  byProgress: { label: string; value: number }[];
  byEvidence: { label: string; value: number }[];
  inProgress: AuditExecutionRow[];
  pendingEvidence: AuditExecutionRow[];
  fieldFindings: AuditExecutionRow[];
  recent: AuditExecutionRow[];
};
