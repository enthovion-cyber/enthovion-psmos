export type ExecutiveRiskCase = {
  id: string;
  case_code?: string;
  risk_title: string;
  case_title?: string;
  risk_priority: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  executive_priority?: string;
  prioritization_score?: number;
  case_status: string;
  case_type?: string;
  source_module: string;
  source_record_type?: string;
  source_record_id?: string;
  canonical_source_key?: string;
  site_id?: string | null;
  unit_id?: string | null;
  executive_owner_user_id?: string | null;
  operational_owner_user_id?: string | null;
  owner_assigned_at?: string | null;
  owner_assignment_reason?: string | null;
  acknowledged_at?: string | null;
  acknowledgment_status?: string;
  pending_verification_count?: number;
  source_resolved_at?: string | null;
  source_status?: string | null;
  source_severity?: string | null;
  source_criticality?: string | null;
  barrier_impaired?: boolean;
  barrier_name?: string | null;
  barrier_type?: string | null;
  data_freshness_status?: string;
  source_due_at?: string | null;
  source_drilldown_route?: string | null;
  restricted?: boolean;
  first_detected_at?: string;
  last_observed_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type ExecutiveOverdueAction = {
  id: string;
  canonical_action_key?: string;
  universal_action_id?: string;
  action_code?: string;
  action_title: string;
  source_module: string;
  source_modules_json?: string[];
  overdue_days: number;
  due_at?: string | null;
  original_due_at?: string | null;
  effective_due_at?: string | null;
  action_owner_user_id?: string | null;
  owner_user_id?: string | null;
  action_priority?: string | null;
  severity?: string | null;
  action_status?: string;
  extension_count?: number;
  repeat_overdue_flag?: boolean;
  site_id?: string | null;
  unit_id?: string | null;
  drilldown_route?: string | null;
  restricted?: boolean;
  calculated_at?: string;
};

export type ExecutiveEscalation = {
  id: string;
  escalation_code: string;
  escalation_status: string;
  escalation_level: number | string;
  escalation_reason: string;
  recipient_user_id?: string | null;
  escalated_to_user_id?: string | null;
  escalated_to_role?: string | null;
  escalation_owner_user_id?: string | null;
  risk_case_id?: string | null;
  universal_action_id?: string | null;
  source_module?: string;
  source_record_type?: string;
  source_record_id?: string;
  due_at?: string | null;
  response_due_at?: string | null;
  sla_status?: string;
  trigger_type?: string;
  priority?: string;
  severity?: string | null;
  site_id?: string | null;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  closure_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
};

export type ExecutiveEscalationEvent = {
  id: string;
  escalation_id: string;
  event_type: string;
  event_title: string;
  event_description?: string | null;
  actor_user_id: string;
  created_at: string;
};

export type ExecutiveEscalationRule = {
  id: string;
  rule_code: string;
  rule_title: string;
  trigger_type: string;
  priority_level: string;
  source_module?: string | null;
  escalation_level: number;
  recipient_user_id?: string | null;
  recipient_role?: string | null;
  active: boolean;
  site_id?: string | null;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  archived_at?: string | null;
  archive_reason?: string | null;
};

export type ExecutiveManagementDecision = {
  id: string;
  decision_code: string;
  escalation_id?: string | null;
  risk_case_id?: string | null;
  decision_type: string;
  decision_summary: string;
  decision_rationale: string;
  decision_maker_user_id: string;
  site_id?: string | null;
  created_at: string;
};

export type ExecutiveRiskCaseSourceLink = {
  id: string;
  risk_case_id: string;
  source_module: string;
  source_record_type: string;
  source_record_id?: string | null;
  relationship_type: string;
  restricted?: boolean;
  source_snapshot_json?: Record<string, unknown> | null;
  source_title?: string;
  linked_by?: string;
  linked_at?: string;
};

export type ExecutiveRiskCaseActionLink = {
  id: string;
  risk_case_id: string;
  universal_action_id: string;
  source_module?: string | null;
  relationship_type: string;
  required_for_case_closure?: boolean;
  linked_by?: string;
  linked_at?: string;
};

export type ExecutiveRiskCaseAcknowledgment = {
  id: string;
  risk_case_id: string;
  recipient_user_id: string;
  acknowledgment_type: string;
  acknowledgment_note?: string | null;
  acknowledged_at: string;
};

export type ExecutiveRiskVerificationRecord = {
  id: string;
  risk_case_id: string;
  source_module?: string;
  source_record_id?: string;
  verification_type: string;
  verification_status: string;
  required: boolean;
  verifier_user_id: string;
  verification_note?: string | null;
  verified_at?: string | null;
  created_at: string;
};

export type ExecutiveCaseDetail = {
  case: ExecutiveRiskCase;
  sourceLinks: ExecutiveRiskCaseSourceLink[];
  actionLinks: ExecutiveRiskCaseActionLink[];
  escalations: ExecutiveEscalation[];
  acknowledgments: ExecutiveRiskCaseAcknowledgment[];
  managementDecisions: ExecutiveManagementDecision[];
  verification: ExecutiveRiskVerificationRecord[];
  history: Array<Record<string, unknown>>;
};

export type ExecutiveEscalationDetail = {
  escalation: ExecutiveEscalation;
  events: ExecutiveEscalationEvent[];
  managementDecisions: ExecutiveManagementDecision[];
};

export type ExecutiveCriticalRiskSummary = {
  openCriticalRisks: number;
  highPriorityRisks: number;
  unacknowledgedRisks: number;
  awaitingVerification: number;
  activeEscalations: number;
  overdueActions: number;
  repeatedOverdueActions: number;
};

export type ExecutiveCriticalRiskDashboard = {
  scope: Record<string, unknown>;
  refreshedAt: string;
  summary: ExecutiveCriticalRiskSummary;
  criticalRisks: ExecutiveRiskCase[];
  activeEscalations: ExecutiveEscalation[];
  overdueActions: ExecutiveOverdueAction[];
  attention: ExecutiveRiskCase[];
};

export type ExecutiveOverdueGroupByOwner = {
  ownerId: string;
  ownerName: string;
  count: number;
  criticalCount: number;
  maxOverdueDays: number;
};

export type ExecutiveOverdueGroupBySite = {
  siteId: string;
  count: number;
  criticalCount: number;
};

export type ExecutiveOverdueGroupByModule = {
  module: string;
  count: number;
  criticalCount: number;
};

export type ExecutivePaged<T> = {
  rows: T[];
  total: number;
  limit: number;
  offset: number;
};
