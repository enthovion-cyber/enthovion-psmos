export type MiReadinessDecision =
  | 'Fit for Service'
  | 'Fit for Service with Restrictions'
  | 'Not Fit for Service'
  | 'Startup Blocked'
  | 'Operate Temporarily Under Deviation'
  | 'Engineering Review Required'
  | 'Pending Verification'
  | 'Out of Service'
  | 'Decommissioned / Retired';

export type MiReadinessAssessment = {
  id: string;
  assessment_number: string;
  equipment_id: string;
  site_id?: string | null;
  equipment_tag?: string | null;
  equipment_name?: string | null;
  equipment_type?: string | null;
  assessment_reason: string;
  assessment_date: string;
  status: string;
  current_equipment_status?: string | null;
  previous_readiness_decision?: string | null;
  recommended_decision: MiReadinessDecision;
  proposed_decision?: MiReadinessDecision | null;
  approved_decision?: MiReadinessDecision | null;
  decision_source?: string | null;
  engineering_justification?: string | null;
  ffs_required: boolean;
  ffs_assessment_reference?: string | null;
  technical_basis?: string | null;
  risk_acceptance_statement?: string | null;
  operation_allowed: boolean;
  startup_blocked: boolean;
  pssr_impact: boolean;
  moc_required: boolean;
  lopa_sil_impact: boolean;
  restriction_active: boolean;
  restriction_expiry_date?: string | null;
  next_review_due?: string | null;
  assessor_user_id?: string | null;
  reviewer_user_id?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  blocker_count?: number | null;
  critical_blockers?: number | null;
  active_restrictions?: number | null;
  equipment?: Record<string, unknown> | null;
  read_only?: boolean | null;
  updated_at?: string | null;
};

export type MiReadinessBlocker = {
  id: string;
  assessment_id: string;
  equipment_id: string;
  source_module: string;
  source_record_id?: string | null;
  source_record_number?: string | null;
  blocker_type: string;
  blocker_title: string;
  blocker_description?: string | null;
  severity: 'Info' | 'Warning' | 'Major' | 'Critical' | 'Startup Blocker';
  blocker_status: string;
  readiness_impact?: string | null;
  startup_blocker: boolean;
  recommended_action?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  waiver_reason?: string | null;
  created_at?: string | null;
};

export type MiReadinessRestriction = {
  id: string;
  assessment_id: string;
  equipment_id: string;
  restriction_type: string;
  restriction_description: string;
  reduced_pressure?: string | null;
  reduced_temperature?: string | null;
  reduced_rate?: string | null;
  additional_monitoring?: string | null;
  temporary_controls?: string | null;
  expiry_date: string;
  owner_user_id?: string | null;
  status: string;
};

export type MiReadinessSummary = Record<string, number>;

export type MiReadinessRegistryResponse = {
  rows: MiReadinessAssessment[];
  page: number;
  limit: number;
  total: number;
  summary: MiReadinessSummary;
  savedViews: string[];
  lastUpdated: string;
};

export type MiReadinessDetailResponse = {
  assessment: MiReadinessAssessment;
  blockers: MiReadinessBlocker[];
  restrictions: MiReadinessRestriction[];
  approvals: Array<Record<string, unknown>>;
  linkedRecords: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  readOnly: boolean;
  readiness: { missing: string[]; blockers: MiReadinessBlocker[]; canApprove: boolean; criticalBlockers: number };
};

export type MiEquipmentReadinessResponse = {
  current?: MiReadinessAssessment | null;
  summary: Record<string, unknown>;
  blockers: MiReadinessBlocker[];
  restrictions: MiReadinessRestriction[];
  assessments: MiReadinessAssessment[];
  history: Array<Record<string, unknown>>;
};

export type MiReadinessLookups = {
  decisions: string[];
  statuses: string[];
  blockerTypes: string[];
  severities: string[];
  assessmentReasons: string[];
};
