export type OpStepHazard = {
  id: string;
  step_id: string;
  hazard_level: 'NOTE' | 'CAUTION' | 'WARNING' | 'DANGER';
  hazard_text: string;
  consequence_of_deviation: string | null;
  corrective_steps: string | null;
  ppe_required: string[];
  created_at: string;
};

export type OpStep = {
  id: string;
  revision_id: string;
  section_id: string;
  parent_step_id: string | null;
  step_order: number;
  step_number: string;
  step_title: string | null;
  step_text: string;
  step_type: 'action' | 'check' | 'verify' | 'record_value' | 'decision' | 'caution' | 'warning' | 'note' | 'hold_point' | 'sign_off' | 'two_person_verify' | 'timer' | 'photo';
  role_required: string | null;
  is_critical: boolean;
  requires_signoff: boolean;
  requires_witness: boolean;
  expected_value: string | null;
  min_value: number | null;
  max_value: number | null;
  uom: string | null;
  psi_sol_id: string | null;
  equipment_id: string | null;
  equipment_tag: string | null;
  estimated_duration_minutes: number | null;
  branch_condition: string | null;
  branch_next_step: string | null;
  hazards?: OpStepHazard[];
  created_at: string;
  updated_at: string;
};

export type OpSection = {
  id: string;
  revision_id: string;
  section_order: number;
  section_title: string;
  section_kind: 'purpose' | 'scope' | 'hazards' | 'ppe' | 'prerequisites' | 'operating_limits' | 'steps' | 'emergency_response' | 'references' | 'attachments';
  content_markdown: string | null;
  content_json: Record<string, unknown> | null;
  created_at: string;
};

export type OpStepComment = {
  id: string;
  revision_id: string;
  step_id: string | null;
  comment_text: string;
  author_user_id: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type OpRevision = {
  id: string;
  procedure_id: string;
  revision_number: number;
  revision_label: string;
  status: 'Draft' | 'In Review' | 'Review Complete' | 'Pending Approval' | 'Approved' | 'Published' | 'Superseded' | 'Archived' | 'Returned';
  change_summary: string | null;
  change_reason: string;
  moc_id: string | null;
  document_version_id: string | null;
  effective_date: string | null;
  superseded_at: string | null;
  content_hash: string | null;
  locked: boolean;
  created_by?: string | null;
  sections?: OpSection[];
  steps?: OpStep[];
  comments?: OpStepComment[];
  created_at: string;
  updated_at: string;
};

export type OpTemplate = {
  id: string;
  procedure_type_code: string;
  template_name: string;
  description: string | null;
  is_default: boolean;
  sections_json: Array<{ title: string; kind: string; order: number }>;
  active: boolean;
};

// Phase 3 Lifecycle Workflow & e-Signatures
export type OpApprovalStage = {
  id: string;
  request_id: string;
  stage_order: number;
  stage_name: string;
  reviewer_role: string;
  assigned_user_ids: string[];
  status: 'Pending' | 'Active' | 'Approved' | 'Returned' | 'Rejected' | 'Skipped';
  esign_required: boolean;
  due_at: string | null;
  completed_at: string | null;
};

export type OpApprovalDecision = {
  id: string;
  request_id: string;
  stage_id: string;
  decision: 'Approved' | 'Approved with Comments' | 'Returned for Revision' | 'Rejected';
  decision_comments: string | null;
  decided_by: string | null;
  decided_at: string;
  meaning_of_signature: string;
  signature_hash: string | null;
  esignature_id: string | null;
};

export type OpApprovalRequest = {
  id: string;
  company_id: string;
  site_id: string | null;
  procedure_id: string;
  revision_id: string;
  request_number: string;
  title: string;
  status: 'Draft' | 'In Review' | 'Review Complete' | 'Pending Approval' | 'Approved' | 'Returned' | 'Rejected' | 'Withdrawn' | 'Published';
  current_stage_order: number;
  priority: string;
  submitted_by: string | null;
  submitted_at: string;
  completed_at: string | null;
  effective_date: string | null;
  submission_notes: string | null;
  stages?: OpApprovalStage[];
  decisions?: OpApprovalDecision[];
};

export type OpPublicationRecord = {
  id: string;
  procedure_id: string;
  revision_id: string;
  published_by: string | null;
  published_at: string;
  effective_date: string;
  distribution_summary: string | null;
  acknowledgment_required: boolean;
  notification_sent: boolean;
};

// Phase 4 Periodic Certification Types (OSHA 1910.119(f)(3))
export type OpCertificationCycle = {
  id: string;
  procedure_id: string;
  cycle_year: number;
  cycle_code: string;
  due_date: string;
  status: 'Upcoming' | 'Due' | 'Overdue' | 'Certified' | 'Certified With Changes' | 'Expired';
  assigned_sme_ids: string[];
  last_certified_at: string | null;
  completed_at: string | null;
  notes: string | null;
  op_procedures?: {
    id: string;
    procedure_number: string;
    title: string;
    procedure_status: string;
    criticality: string;
    review_frequency_months: number;
    site_id: string | null;
    unit_id: string | null;
  };
};

export type OpChecklistItem = {
  id: string;
  item_code: string;
  question_text: string;
  osha_subparagraph: string;
  sort_order: number;
};

export type OpCertificationReview = {
  id: string;
  cycle_id: string;
  procedure_id: string;
  reviewer_user_id: string;
  checklist_responses: Record<string, boolean>;
  findings_summary: string | null;
  outcome: 'Current & Accurate (No Change)' | 'Certified with Minor Edits' | 'Revision Required via MOC';
  meaning_of_signature: string;
  signature_hash: string | null;
  certified_at: string;
};

export type OpAnnualStatement = {
  id: string;
  site_id: string;
  year: number;
  total_procedures: number;
  certified_procedures: number;
  procedures_under_revision: number;
  overdue_procedures: number;
  compliance_percentage: number;
  signed_by_user_id: string | null;
  signed_at: string | null;
  statement_text: string;
  statement_status: 'Draft' | 'Generated' | 'Certified & Signed';
  signature_hash: string | null;
};

export type OpProcedure = {
  id: string;
  company_id: string;
  site_id: string | null;
  area_id: string | null;
  unit_id: string | null;
  equipment_id: string | null;
  procedure_number: string;
  title: string;
  purpose: string | null;
  scope_summary: string | null;
  procedure_type_code: string;
  procedure_type_id: string | null;
  category_id: string | null;
  operating_mode: string | null;
  criticality: 'High' | 'Medium' | 'Low';
  is_psm_covered: boolean;
  is_safe_work_practice: boolean;
  is_template: boolean;
  is_temporary: boolean;
  temporary_expires_at: string | null;
  procedure_status: string;
  certification_status: string;
  current_revision_id?: string | null;
  current_revision_label: string | null;
  effective_date: string | null;
  owner_user_id: string | null;
  sme_user_ids: string[];
  review_frequency_months: number;
  last_certified_at: string | null;
  next_certification_due: string | null;
  days_to_certification_due: number | null;
  regulatory_basis: string[];
  tags: string[];
  locked: boolean;
  lock_reason: string | null;
  notes: string | null;
  archived_at: string | null;
  archive_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type OpProcedureType = { id: string; type_code: string; type_name: string; phase_group: string; osha_reference: string | null; is_safe_work_practice: boolean; is_psm_required: boolean; default_review_frequency_months: number; number_prefix: string };
export type OpCategory = { id: string; category_code: string; category_name: string };
export type OpScopeRow = { id: string; scope_type: string; scope_record_id: string | null; scope_label: string | null; linked_at: string };

export type OpSummary = {
  total: number; published: number; draft: number; inReview: number; underRevision: number;
  overdueCertification: number; dueNext30: number; certifiedCurrentPct: number; highCriticality: number;
  safeWorkPractices: number; temporaryExpiring: number; byStatus: Record<string, number>; byType: Record<string, number>;
};

export type OpRegister = { items: OpProcedure[]; total: number; page: number; limit: number; summary: OpSummary };

export type OpCoverage = { units: string[]; gaps: number; types: Array<{ type_code: string; type_name: string; phase_group: string; osha_reference: string | null; units: Array<{ unitId: string; total: number; published: number }> }> };

export type OpDashboard = { summary: OpSummary; upcomingCertifications: OpProcedure[]; recentlyUpdated: OpProcedure[]; coverage: OpCoverage };

export type OpLookups = { types: OpProcedureType[]; categories: OpCategory[]; statuses: string[]; certificationStatuses: string[]; criticalityLevels: string[]; operatingModes: string[]; scopeTypes: string[] };

export type OpDetail = OpProcedure & { scopes: OpScopeRow[]; type: OpProcedureType | null; category: OpCategory | null; permissions: { editable: boolean } };

export type OpHistoryEvent = { id: string; event_type: string; event_title: string; event_description: string | null; actor_user_id: string | null; created_at: string };
export type OpAccessLog = { id: string; user_id: string | null; access_type: string; channel: string | null; created_at: string };

// Phase 5 Execution & Field Checklists
export type OpExecutionHold = {
  id: string;
  execution_id: string;
  step_id: string;
  step_number: string | null;
  hold_reason: string;
  required_role: string | null;
  status: 'Holding' | 'Released' | 'Bypassed';
  released_by_user_id: string | null;
  released_at: string | null;
  release_notes: string | null;
  signature_hash: string | null;
  created_at: string;
};

export type OpExecutionDeviation = {
  id: string;
  execution_id: string;
  execution_step_id: string | null;
  step_number: string | null;
  parameter_name: string;
  expected_limits: string | null;
  actual_value: string;
  deviation_severity: 'Low' | 'Medium' | 'High' | 'Critical';
  deviation_description: string;
  immediate_corrective_action: string;
  logged_by_user_id: string;
  action_id: string | null;
  incident_id: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
};

export type OpExecutionHandover = {
  id: string;
  execution_id: string;
  shift_from: string;
  shift_to: string;
  outgoing_supervisor_id: string;
  incoming_supervisor_id: string;
  current_step_number: string | null;
  handover_notes: string;
  equipment_status: string | null;
  hazards_or_deviations_noted: string | null;
  signed_at: string;
  created_at: string;
};

export type OpExecutionStep = {
  id: string;
  execution_id: string;
  step_id: string | null;
  section_id: string | null;
  section_title: string | null;
  step_number: string;
  step_title: string | null;
  step_text: string;
  step_type: string;
  step_order: number;
  is_critical: boolean;
  requires_signoff: boolean;
  requires_witness: boolean;
  is_hold_point: boolean;
  expected_limits: string | null;
  min_value: number | null;
  max_value: number | null;
  uom: string | null;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped' | 'Deviated' | 'N/A';
  recorded_value: string | null;
  recorded_numeric: number | null;
  is_in_limits: boolean | null;
  skip_reason: string | null;
  deviation_reason: string | null;
  performed_by_user_id: string | null;
  performed_at: string | null;
  witness_by_user_id: string | null;
  witness_at: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OpExecution = {
  id: string;
  company_id: string;
  site_id: string | null;
  procedure_id: string;
  revision_id: string;
  execution_number: string;
  title: string;
  execution_mode: 'Startup' | 'Shutdown' | 'Normal' | 'Emergency Shutdown' | 'Emergency Operation' | 'Temporary' | 'Training' | 'Dry Run';
  unit_id: string | null;
  equipment_id: string | null;
  shift: string | null;
  crew: string | null;
  linked_ptw_id: string | null;
  linked_pssr_id: string | null;
  linked_moc_id: string | null;
  status: 'Planned' | 'In Progress' | 'Paused' | 'Completed' | 'Aborted' | 'Under Review' | 'Reviewed';
  started_at: string;
  completed_at: string | null;
  executed_by_user_id: string;
  supervisor_user_id: string | null;
  supervisor_signed_at: string | null;
  supervisor_notes: string | null;
  total_steps: number;
  completed_steps: number;
  skipped_steps: number;
  deviated_steps: number;
  progress_pct?: number;
  offline_cached: boolean;
  procedure?: OpProcedure | null;
  revision?: OpRevision | null;
  steps?: OpExecutionStep[];
  holds?: OpExecutionHold[];
  deviations?: OpExecutionDeviation[];
  handovers?: OpExecutionHandover[];
  created_at: string;
  updated_at: string;
};

// Phase 6 MOC, PSI, HAZOP Linking & Change Flags
export type OpChangeFlag = {
  id: string;
  company_id: string;
  site_id: string | null;
  procedure_id: string;
  source_type: 'MOC' | 'PSI' | 'HAZOP' | 'LOPA' | 'INCIDENT' | 'AUDIT' | 'MANUAL';
  source_id: string;
  source_reference: string;
  source_title: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reason: string;
  description: string | null;
  suggested_changes: string | null;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Dismissed';
  blocks_moc_closure: boolean;
  target_revision_id: string | null;
  flagged_by_user_id: string | null;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  dismissal_reason: string | null;
  procedure?: OpProcedure | null;
  created_at: string;
  updated_at: string;
};

export type OpLinkedRecord = {
  id: string;
  company_id: string;
  site_id: string | null;
  procedure_id: string;
  revision_id: string | null;
  step_id: string | null;
  record_type: 'PSI_SOL' | 'PSI_CHEMICAL' | 'PSI_DRAWING' | 'EQUIPMENT' | 'MOC' | 'HAZOP_REC' | 'INCIDENT_CAPA';
  record_id: string;
  record_reference: string;
  record_title: string;
  sync_status: 'In Sync' | 'Change Flagged' | 'Unlinked';
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// Phase 7 Read-and-Understand Acknowledgment
export type OpAcknowledgmentRequirement = {
  id: string;
  procedure_id: string;
  revision_id: string;
  requirement_title: string;
  target_audience: string;
  grace_period_days: number;
  due_date: string | null;
  requires_quiz: boolean;
  min_quiz_score: number;
  status: string;
  created_at: string;
};

export type OpAcknowledgmentRecord = {
  id: string;
  requirement_id: string;
  procedure_id: string;
  revision_id: string;
  worker_user_id: string;
  status: 'Pending' | 'Acknowledged' | 'Overdue' | 'Waived';
  due_date: string;
  acknowledged_at: string | null;
  signature_hash: string | null;
  attestation_statement: string | null;
  quiz_score: number | null;
  quiz_passed: boolean | null;
  worker?: { id: string; name: string; email: string } | null;
  created_at: string;
  updated_at: string;
};

export type OpProcedureAckStats = {
  totalAssigned: number;
  acknowledgedCount: number;
  pendingCount: number;
  overdueCount: number;
  compliancePercentage: number;
};

// Phase 8 Safe Work Practices & JSA
export type OpSwpProgram = {
  id: string;
  company_id: string;
  site_id: string | null;
  program_code: string;
  program_name: string;
  regulatory_reference: string;
  description: string;
  mandatory_ppe: string[];
  gas_testing_required: boolean;
  permit_required: boolean;
  permit_type: string | null;
  training_qualification_code: string | null;
  standard_operating_procedure_id: string | null;
  checklist_items: Array<{ id: string; label: string; critical: boolean }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OpJsaStep = {
  id: string;
  jsa_id: string;
  step_number: number;
  job_step_description: string;
  potential_hazards: string;
  consequence: string | null;
  hazard_category: string;
  preventative_controls: string;
  initial_severity: string;
  initial_likelihood: string;
  residual_severity: string;
  residual_likelihood: string;
  responsible_role: string | null;
  created_at: string;
};

export type OpJsaRoster = {
  id: string;
  jsa_id: string;
  worker_user_id: string;
  worker_name: string;
  contractor_company: string | null;
  role: string;
  attended_briefing: boolean;
  acknowledged_at: string;
  signature_hash: string | null;
};

export type OpJsa = {
  id: string;
  company_id: string;
  site_id: string | null;
  jsa_number: string;
  title: string;
  unit_id: string | null;
  equipment_id: string | null;
  swp_program_id: string | null;
  procedure_id: string | null;
  work_order_id: string | null;
  linked_ptw_id: string | null;
  job_location: string;
  prepared_by_user_id: string;
  supervisor_user_id: string | null;
  hse_reviewer_user_id: string | null;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Active' | 'Completed' | 'Archived';
  initial_risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  residual_risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  required_ppe: string[];
  special_tools_equipment: string | null;
  emergency_rescue_plan: string | null;
  approved_at: string | null;
  steps?: OpJsaStep[];
  roster?: OpJsaRoster[];
  swp_program?: OpSwpProgram | null;
  created_at: string;
  updated_at: string;
};

// Phase 9 Reports & Audit Evidence Package
export type OpAuditPackage = {
  id: string;
  company_id: string;
  site_id: string | null;
  package_number: string;
  title: string;
  scope_type: string;
  year: number;
  status: string;
  package_data: Record<string, any>;
  created_at: string;
};

export type OpControlledCopy = {
  procedureNumber: string;
  title: string;
  revisionLabel: string;
  effectiveDate: string | null;
  watermarkText: string;
  printDate: string;
  validOnlyOnDate: string;
  verificationUrl: string;
  psmCovered: boolean;
  regulatoryBasis: string[];
};
