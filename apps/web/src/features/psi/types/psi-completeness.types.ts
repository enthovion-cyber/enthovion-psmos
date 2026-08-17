export type PsiCompletenessEvaluation = {
  id: string;
  category: string;
  requirement_name: string;
  status: string;
  severity: string;
  missing_reason?: string | null;
  linked_module?: string | null;
  linked_record_id?: string | null;
  linked_document_id?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  readiness_impact?: string | null;
  pssr_blocker: boolean;
  evaluated_at: string;
};

export type PsiCompletenessResponse = {
  unitId: string;
  score: number;
  status: string;
  criticalGapCount: number;
  pssrBlocker: boolean;
  mocUpdateRequired: boolean;
  evaluations: PsiCompletenessEvaluation[];
  missingItems: PsiCompletenessEvaluation[];
};

export type PsiCompletenessScore = {
  id?: string;
  site_id?: string | null;
  unit_id?: string | null;
  equipment_id?: string | null;
  score_scope?: string | null;
  score_module?: string | null;
  score?: number | null;
  score_status?: string | null;
  total_applicable_requirements?: number | null;
  complete_count?: number | null;
  partial_count?: number | null;
  missing_count?: number | null;
  waived_count?: number | null;
  critical_gap_count?: number | null;
  pssr_blocker_count?: number | null;
  conflict_count?: number | null;
  review_overdue_count?: number | null;
  document_gap_count?: number | null;
  blocking_reasons_json?: string[] | null;
  evaluated_at?: string | null;
};

export type PsiCompletenessGap = {
  id: string;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  requirement_id?: string | null;
  run_id?: string | null;
  psi_module?: string | null;
  gap_title?: string | null;
  gap_type?: string | null;
  gap_severity?: string | null;
  gap_status?: string | null;
  source_module?: string | null;
  source_record_id?: string | null;
  source_record_title?: string | null;
  missing_item?: string | null;
  evidence_expected?: string | null;
  evidence_found?: string | null;
  reason?: string | null;
  recommended_action?: string | null;
  pssr_blocker?: boolean | null;
  moc_required?: boolean | null;
  mi_readiness_impact?: boolean | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  first_detected_at?: string | null;
  last_detected_at?: string | null;
};

export type PsiCompletenessMatrixRow = {
  id: string;
  psi_module?: string | null;
  requirement_name?: string | null;
  evaluation_status?: string | null;
  status?: string | null;
  severity?: string | null;
  evidence?: { expected?: string | null; found?: string | null; record?: unknown };
  sourceModule?: string | null;
  sourceRecord?: string | null;
  documentStatus?: string | null;
  reviewStatus?: string | null;
  conflictStatus?: string | null;
  mocRequired?: boolean | null;
  pssrBlocker?: boolean | null;
  lastEvaluated?: string | null;
};

export type PsiCompletenessRequirement = {
  id: string;
  site_id?: string | null;
  requirement_code?: string | null;
  requirement_title?: string | null;
  requirement_name?: string | null;
  psi_module?: string | null;
  requirement_category?: string | null;
  requirement_description?: string | null;
  applicability_scope?: string | null;
  required_evidence_type?: string | null;
  required_source_module?: string | null;
  required_document_type?: string | null;
  required_review_frequency_days?: number | null;
  weight?: number | null;
  severity_if_missing?: string | null;
  pssr_blocker_if_missing?: boolean | null;
  moc_required_if_changed?: boolean | null;
  action_required_if_missing?: boolean | null;
  waiver_allowed?: boolean | null;
  owner_role?: string | null;
  active?: boolean | null;
};

export type PsiCompletenessRun = {
  id: string;
  site_id?: string | null;
  unit_id?: string | null;
  equipment_id?: string | null;
  run_number?: string | null;
  run_type?: string | null;
  run_scope?: string | null;
  status?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  score_before?: number | null;
  score_after?: number | null;
  requirements_evaluated?: number | null;
  gaps_created?: number | null;
  gaps_closed?: number | null;
  warnings_count?: number | null;
  errors_count?: number | null;
  error_message?: string | null;
};

export type PsiCompletenessWaiver = {
  id: string;
  gap_id?: string | null;
  site_id?: string | null;
  unit_id?: string | null;
  waiver_status?: string | null;
  approval_status?: string | null;
  waiver_reason?: string | null;
  expiry_date?: string | null;
  requested_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
};

export type PsiCompletenessSettings = {
  id?: string;
  company_id?: string;
  site_id?: string | null;
  scoring_method?: string | null;
  critical_gap_score_cap?: number | null;
  pssr_blocker_score_cap?: number | null;
  auto_create_actions?: boolean | null;
  auto_notify_owners?: boolean | null;
  auto_create_pssr_blockers?: boolean | null;
  allow_critical_waivers?: boolean | null;
  require_esign_for_waiver?: boolean | null;
  scheduled_run_enabled?: boolean | null;
  scheduled_run_frequency?: string | null;
  default_review_frequency_days?: number | null;
  settings_json?: Record<string, unknown> | null;
};

export type PsiCompletenessDashboard = {
  summary: Record<string, any>;
  charts: Record<string, any>;
  topIncompleteUnits: Array<Record<string, any>>;
  recurringGapTypes: Array<Record<string, any>>;
  upcomingReviewDue: PsiCompletenessGap[];
  waiversExpiringSoon: PsiCompletenessWaiver[];
  filters: Record<string, unknown>;
  lastUpdated: string;
};

export type PsiPaged<T> = {
  rows: T[];
  page?: number;
  limit?: number;
  summary?: Record<string, any>;
  lastUpdated?: string;
};
