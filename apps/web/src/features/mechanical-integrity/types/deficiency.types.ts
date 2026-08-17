export type MiDeficiencyStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Action Assigned'
  | 'In Progress'
  | 'Waiting on MOC'
  | 'Waiting on Shutdown'
  | 'Waiting on Parts'
  | 'Temporary Control Active'
  | 'Ready for Verification'
  | 'Verification Failed'
  | 'Verified'
  | 'Closed'
  | 'Rejected'
  | 'Cancelled';

export type MiDeviationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'Expiring Soon'
  | 'Expired'
  | 'Extension Requested'
  | 'Extension Approved'
  | 'Pending Closure Verification'
  | 'Closed'
  | 'Rejected'
  | 'Cancelled';

export type MiSeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type MiDeficiencyRow = {
  id: string;
  record_number?: string | null;
  record_kind?: string | null;
  title?: string | null;
  description?: string | null;
  equipment_id?: string | null;
  equipment_tag?: string | null;
  source_module?: string | null;
  source_record_id?: string | null;
  source_summary?: string | null;
  evidence_document_id?: string | null;
  deficiency_type?: string | null;
  deficiency_location?: string | null;
  location_description?: string | null;
  observed_condition?: string | null;
  required_condition?: string | null;
  severity?: MiSeverityLevel | string | null;
  risk_level?: MiSeverityLevel | string | null;
  status?: MiDeficiencyStatus | string | null;
  fitness_for_service_impact?: string | null;
  startup_blocker?: boolean | null;
  operation_allowed?: boolean | null;
  operating_restrictions?: string | null;
  operation_restrictions?: string | null;
  ffs_required?: boolean | null;
  engineering_review_required?: boolean | null;
  moc_required?: boolean | null;
  moc_suggested?: boolean | null;
  pssr_impact?: boolean | null;
  lopa_sil_impact?: boolean | null;
  temporary_control_required?: boolean | null;
  due_date?: string | null;
  target_closure_date?: string | null;
  owner_user_id?: string | null;
  reviewer_user_id?: string | null;
  approver_user_id?: string | null;
  reported_by?: string | null;
  verified_at?: string | null;
  closed_at?: string | null;
  read_only?: boolean | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type MiDeficiencySummary = {
  totalOpenDeficiencies?: number;
  criticalDeficiencies?: number;
  highSeverityDeficiencies?: number;
  startupBlockers?: number;
  overdueDeficiencies?: number;
  pendingReview?: number;
  pendingApproval?: number;
  pendingVerification?: number;
  closedThisMonth?: number;
  activeDeviations?: number;
  expiringDeviations?: number;
  expiredDeviations?: number;
  temporaryRepairsActive?: number;
  ffsRequired?: number;
  mocRequiredSuggested?: number;
  linkedActionsOpen?: number;
  linkedWorkOrdersOpen?: number;
  equipmentNotFitForService?: number;
  equipmentFitWithRestrictions?: number;
};

export type MiDeficiencyRegistryResponse = {
  rows: MiDeficiencyRow[];
  page: number;
  limit: number;
  total: number;
  summary?: MiDeficiencySummary;
  savedViews?: string[];
  lastUpdated?: string;
};

export type MiTemporaryControl = {
  id?: string;
  control_description?: string | null;
  reduced_operating_envelope?: boolean | null;
  additional_monitoring?: boolean | null;
  temporary_repair?: boolean | null;
  extra_inspection_required?: boolean | null;
  manual_check_required?: boolean | null;
  operator_instruction?: string | null;
  expiry_date?: string | null;
  owner_user_id?: string | null;
  status?: string | null;
};

export type MiDeficiencyDetailResponse = {
  deficiency: MiDeficiencyRow;
  temporaryControls?: MiTemporaryControl[];
  approvals?: Array<Record<string, unknown>>;
  verifications?: Array<Record<string, unknown>>;
  linkedRecords?: Array<Record<string, unknown>>;
  history?: Array<Record<string, unknown>>;
  readiness: { status: 'Ready' | 'Warning' | 'Blocked'; blockers: string[]; warnings: string[] };
};

export type MiDeviationRow = {
  id: string;
  record_number?: string | null;
  title?: string | null;
  description?: string | null;
  equipment_id?: string | null;
  equipment_tag?: string | null;
  deviation_type?: string | null;
  requirement_reference?: string | null;
  normal_requirement?: string | null;
  requested_deviation?: string | null;
  reason?: string | null;
  risk_assessment_summary?: string | null;
  risk_assessment_json?: Record<string, unknown> | string | null;
  temporary_controls?: string | null;
  temporary_controls_json?: Record<string, unknown> | string | null;
  status?: MiDeviationStatus | string | null;
  start_date?: string | null;
  expiry_date?: string | null;
  extension_allowed?: boolean | null;
  max_extension_days?: number | null;
  extension_limit_value?: number | string | null;
  extension_limit_unit?: string | null;
  closure_requirement?: string | null;
  owner_user_id?: string | null;
  approver_user_id?: string | null;
  read_only?: boolean | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type MiDeviationRegistryResponse = {
  rows: MiDeviationRow[];
  page: number;
  limit: number;
  total: number;
  savedViews?: string[];
  lastUpdated?: string;
};

export type MiDeviationDetailResponse = {
  deviation: MiDeviationRow;
  linkedRecords?: Array<Record<string, unknown>>;
  history?: Array<Record<string, unknown>>;
  readiness: { status: 'Ready' | 'Warning' | 'Blocked'; blockers: string[]; warnings: string[] };
};

export type MiDeficiencyLookups = {
  deficiencyTypes: string[];
  deviationTypes: string[];
  deficiencyStatuses: string[];
  deviationStatuses: string[];
  severityLevels: string[];
  riskLevels: string[];
};
