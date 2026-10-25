// apps/web/src/features/contractor-safety/types/contractor-safety.types.ts

export type CsmTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export type CsmStatus =
  | 'PENDING_PREQUAL'
  | 'ACTIVE'
  | 'CONDITIONAL'
  | 'SUSPENDED'
  | 'DISQUALIFIED'
  | 'INACTIVE';

export type CsmSafetyGrade = 'A' | 'B' | 'C' | 'D' | 'F' | 'UNRATED';

export type CsmDocumentType =
  | 'COI_GENERAL_LIABILITY'
  | 'COI_WORKERS_COMP'
  | 'COI_AUTO'
  | 'COI_UMBRELLA'
  | 'OSHA_300'
  | 'OSHA_300A'
  | 'SAFETY_PROGRAM_MANUAL'
  | 'EMR_RATING_LETTER'
  | 'HAZCOM_WRITTEN_PLAN'
  | 'OTHER';

export type CsmVerificationStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'MISSING';

export interface ContractorProfile {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  company_name: string;
  company_code: string;
  tier: CsmTier;
  specialties: string[];
  status: CsmStatus;
  safety_grade: CsmSafetyGrade;
  prequal_score?: number | null;
  prequal_valid_until?: string | null;
  rolling_safety_index?: number | null;
  total_evaluations_count?: number | null;
  primary_contact_name?: string | null;
  primary_contact_title?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  office_address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  tax_id_ein?: string | null;
  portal_access_token?: string | null;
  portal_token_expires_at?: string | null;
  portal_status?: string | null;
  portal_last_login_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractorSite {
  id: string;
  tenant_id: string;
  contractor_id: string;
  site_id: string;
  status: string;
  granted_by?: string | null;
  granted_at?: string | null;
}

export interface ContractorDocument {
  id: string;
  tenant_id: string;
  contractor_id: string;
  document_type: CsmDocumentType;
  title: string;
  file_name: string;
  file_url: string;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  policy_number?: string | null;
  insurance_carrier?: string | null;
  coverage_amount_usd?: number | null;
  effective_date?: string | null;
  expiration_date?: string | null;
  verification_status: CsmVerificationStatus;
  verified_by_user_id?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  uploaded_via_portal: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortalAuditLog {
  id: string;
  contractor_id: string;
  event_type: string;
  event_payload?: Record<string, any>;
  actor_ip?: string | null;
  actor_email?: string | null;
  created_at: string;
}

export interface ContractorDetail extends ContractorProfile {
  sites: ContractorSite[];
  documents: ContractorDocument[];
  auditLogs: PortalAuditLog[];
}

export interface CsmDashboardMetrics {
  totalContractors: number;
  activeContractors: number;
  tier1Contractors: number;
  gradeAPercent: number;
  expiringDocumentsCount: number;
  expiredDocumentsCount: number;
  pendingVerificationsCount: number;
  avgPrequalScore: number;
}

export interface CsmDashboardResponse {
  metrics: CsmDashboardMetrics;
  distributions: {
    byTier: Record<string, number>;
    byStatus: Record<string, number>;
    byGrade: Record<string, number>;
  };
  expiringDocumentsList: ContractorDocument[];
  expiredDocumentsList: ContractorDocument[];
  pendingVerificationsList: ContractorDocument[];
}

export interface PortalChecklistItem {
  document_type: CsmDocumentType;
  label: string;
  isRequired: boolean;
  document: ContractorDocument | null;
  isUploaded: boolean;
  verification_status: CsmVerificationStatus;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface ContractorPortalOverview {
  contractor: ContractorProfile;
  documents: ContractorDocument[];
  checklist: PortalChecklistItem[];
  complianceSummary: {
    totalRequired: number;
    verifiedCount: number;
    missingCount: number;
    pendingReviewCount: number;
    expiringSoonCount: number;
    isFullyCompliant: boolean;
  };
  auditLogs: PortalAuditLog[];
}

export interface CsmLookupsResponse {
  tiers: { value: CsmTier; label: string; description: string }[];
  statuses: { value: CsmStatus; label: string; color: string }[];
  grades: { value: CsmSafetyGrade; label: string; color: string }[];
  specialties: string[];
  documentTypes: { value: CsmDocumentType; label: string; requiredFor: readonly string[] }[];
}

export interface ContractorMetrics {
  id: string;
  tenant_id: string;
  contractor_id: string;
  year: number;
  total_hours_worked: number;
  fatalities_count: number;
  recordable_cases_count: number;
  dart_cases_count: number;
  trir: number;
  dart_rate: number;
  emr: number;
  emr_carrier?: string | null;
  osha_citations_count: number;
  osha_citations_penalties_usd: number;
  has_written_safety_program: boolean;
  has_subcontractor_management_plan: boolean;
  verification_doc_id?: string | null;
  recorded_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrequalScoreBreakdown {
  emrScore: number;
  trirScore: number;
  fatalityScore: number;
  dartScore: number;
  programScore: number;
}

export interface PrequalEvaluation {
  id: string;
  tenant_id: string;
  contractor_id: string;
  evaluation_date: string;
  evaluator_user_id?: string | null;
  overall_score: number;
  safety_grade: CsmSafetyGrade;
  three_year_avg_trir: number;
  three_year_avg_dart: number;
  current_emr: number;
  fatalities_in_three_years: number;
  citations_in_three_years: number;
  score_breakdown: PrequalScoreBreakdown;
  evaluation_notes?: string | null;
  valid_until: string;
  is_current: boolean;
  created_at: string;
}

export type CsmVarianceStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVOKED';

export interface ContractorVariance {
  id: string;
  tenant_id: string;
  contractor_id: string;
  variance_number: string;
  title: string;
  reason_category: string;
  justification: string;
  work_scope: string;
  target_unit_id?: string | null;
  target_site_id?: string | null;
  required_mitigations: string[];
  starts_at: string;
  expires_at: string;
  status: CsmVarianceStatus;
  requested_by_user_id: string;
  approver_user_id?: string | null;
  approved_at?: string | null;
  approval_notes?: string | null;
  created_at: string;
  updated_at: string;
  contractor?: {
    company_name: string;
    company_code: string;
    tier: string;
    safety_grade: string;
  } | null;
}

export interface PrequalScoringRules {
  weights: {
    emrMax: number;
    trirMax: number;
    fatalityMax: number;
    dartMax: number;
    complianceProgramMax: number;
  };
  gradeThresholds: Record<
    string,
    { min: number; label: string }
  >;
  benchmarks: {
    industryAvgTrir: number;
    industryAvgDart: number;
    standardEmr: number;
  };
}

export interface ContractorPrequalSummary {
  contractor: {
    id: string;
    company_name: string;
    company_code: string;
    tier: CsmTier;
    status: CsmStatus;
    safety_grade: CsmSafetyGrade;
    prequal_score?: number | null;
    prequal_valid_until?: string | null;
  };
  currentEvaluation: PrequalEvaluation | null;
  evaluationHistory: PrequalEvaluation[];
  metricsHistory: ContractorMetrics[];
  variances: ContractorVariance[];
  activeVariance: ContractorVariance | null;
}

// ============================================================================
// Phase 3: Worker-Level Credential & Certification Types
// ============================================================================

export type CsmCraftTrade =
  | 'PIPEFITTER'
  | 'WELDER_ASME9'
  | 'SCAFFOLDER_COMPETENT'
  | 'ELECTRICIAN_EE'
  | 'INSTRUMENT_TECH'
  | 'RIGGER'
  | 'MILLWRIGHT'
  | 'INSULATOR'
  | 'GENERAL_LABOR';

export type CsmCraftSkillLevel =
  | 'APPRENTICE'
  | 'JOURNEYMAN'
  | 'FOREMAN'
  | 'SUPERINTENDENT'
  | 'MASTER_CRAFTSMAN';

export type CsmBadgeStatus =
  | 'ACTIVE'
  | 'PENDING_VERIFICATION'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REVOKED';

export type CsmCertCategory =
  | 'OSHA_STANDARD'
  | 'PROCESS_SAFETY'
  | 'TRADE_QUALIFICATION'
  | 'EQUIPMENT_OPERATION'
  | 'EMERGENCY_RESPONSE';

export type CsmCertStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface CsmWorkerCertification {
  id: string;
  company_id: string;
  worker_id: string;
  certification_name: string;
  certification_category: CsmCertCategory;
  certifying_body: string;
  certificate_number?: string | null;
  issue_date: string;
  expiration_date?: string | null;
  document_url?: string | null;
  verification_status: CsmCertStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;
  is_ptw_blocking: boolean;
  is_expired?: boolean;
  effective_status?: CsmCertStatus;
  created_at: string;
  updated_at: string;
}

export interface CsmContractorWorker {
  id: string;
  company_id: string;
  contractor_id: string;
  worker_code: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  badge_number?: string | null;
  craft_trade: CsmCraftTrade;
  craft_skill_level: CsmCraftSkillLevel;
  badge_status: CsmBadgeStatus;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  photo_url?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  contractor?: {
    id: string;
    company_name: string;
    vendor_number: string;
    safety_grade: CsmSafetyGrade;
    status: CsmStatus;
  } | null;
  certifications?: CsmWorkerCertification[];
  stats?: {
    total_certifications: number;
    verified_certifications: number;
    expired_certifications: number;
    pending_certifications: number;
    ptw_eligible: boolean;
  };
}

export interface CsmWorkerDetail extends CsmContractorWorker {
  compliance_summary: {
    total_certifications: number;
    verified_count: number;
    expired_count: number;
    pending_count: number;
    ptw_eligible: boolean;
    block_reasons: string[];
  };
}

export interface CsmExpiringRadar {
  summary: {
    total_flagged: number;
    expired_count: number;
    urgent_7_days_count: number;
    warning_30_days_count: number;
    upcoming_60_days_count: number;
  };
  expired: (CsmWorkerCertification & { worker: CsmContractorWorker })[];
  urgent7Days: (CsmWorkerCertification & { worker: CsmContractorWorker })[];
  warning30Days: (CsmWorkerCertification & { worker: CsmContractorWorker })[];
  upcoming60Days: (CsmWorkerCertification & { worker: CsmContractorWorker })[];
}

export interface CsmPtwEligibilityResult {
  worker_id: string;
  worker_name: string;
  craft_trade: string;
  badge_status: string;
  badge_ok: boolean;
  required_certifications: string[];
  missing_certifications: string[];
  is_eligible: boolean;
  reasons: string[];
}

// ============================================================================
// Phase 4: Induction Courses & QR Gate Pass Types
// ============================================================================

export type CsmInductionTargetAudience =
  | 'ALL_CONTRACTORS'
  | 'TIER_1_ONLY'
  | 'UNIT_SPECIFIC'
  | 'TURNAROUND_SPECIAL';

export interface CsmInductionSlide {
  title: string;
  content: string;
  key_points?: string[];
  image_url?: string;
}

export interface CsmQuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface CsmInductionCourse {
  id: string;
  company_id: string;
  site_id?: string | null;
  unit_id?: string | null;
  course_code: string;
  title: string;
  description?: string | null;
  target_audience: CsmInductionTargetAudience;
  passing_score_percent: number;
  validity_period_days: number;
  slides_content: CsmInductionSlide[];
  quiz_questions: CsmQuizQuestion[];
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_completions?: number;
  total_slides?: number;
  total_questions?: number;
}

export interface CsmWorkerInduction {
  id: string;
  company_id: string;
  worker_id: string;
  course_id: string;
  completion_status: 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'EXPIRED';
  score_percent?: number | null;
  attempts_count: number;
  completed_at?: string | null;
  expires_at?: string | null;
  quiz_answers?: any;
  hazard_acknowledgment_signed: boolean;
  hazard_acknowledgment_signature_name?: string | null;
  hazard_acknowledgment_timestamp?: string | null;
  created_at: string;
  updated_at: string;
  course?: CsmInductionCourse | null;
}

export type CsmGatePassStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';

export interface CsmGatePass {
  id: string;
  company_id: string;
  worker_id: string;
  pass_code: string;
  qr_data: string;
  status: CsmGatePassStatus;
  valid_from: string;
  valid_until: string;
  authorized_sites: string[];
  authorized_units: string[];
  last_scanned_at?: string | null;
  last_scanned_gate?: string | null;
  scan_history?: { timestamp: string; gate: string; decision: string }[];
  is_expired?: boolean;
  effective_status?: string;
  created_at: string;
  updated_at: string;
  worker?: CsmContractorWorker | null;
}

export interface CsmGateScanResult {
  access_granted: boolean;
  rejection_reason?: string;
  message: string;
  worker?: {
    id: string;
    worker_code: string;
    name: string;
    craft_trade: string;
    badge_number?: string | null;
    contractor?: string;
    safety_grade?: string;
  };
  gate_pass?: {
    pass_code: string;
    valid_until: string;
    authorized_units: string[];
    last_scanned_at: string;
    scanned_gate: string;
  };
  pass?: CsmGatePass;
}

// ============================================================================
// Phase 5: Post-Job Safety Evaluations & Permanent Scorecard (OSHA 1910.119(h)(2)(v))
// ============================================================================

export type CsmEvaluationStatus = 'SUBMITTED' | 'ACKNOWLEDGED_BY_VENDOR' | 'UNDER_DISPUTE' | 'CLOSED';

export interface CsmPostJobEvaluation {
  id: string;
  company_id: string;
  contractor_id: string;
  work_order_or_job_number: string;
  evaluation_title: string;
  evaluator_user_id?: string | null;
  evaluation_date: string;
  work_category: string;
  site_id?: string | null;
  unit_id?: string | null;
  ppe_compliance_score: number; // 1-5
  housekeeping_score: number; // 1-5
  ptw_adherence_score: number; // 1-5
  near_miss_reporting_score: number; // 1-5
  stop_work_authority_score: number; // 1-5
  quality_and_craftsmanship_score: number; // 1-5
  schedule_adherence_score: number; // 1-5
  composite_score_percent: number; // 0 - 100
  safety_incidents_occurred: boolean;
  incidents_summary?: string | null;
  strengths?: string | null;
  improvement_areas?: string | null;
  recommend_for_future_work: boolean;
  supervisor_signature_name: string;
  vendor_feedback_comments?: string | null;
  status: CsmEvaluationStatus;
  created_at: string;
  updated_at: string;
  contractor?: {
    id: string;
    company_name: string;
    vendor_number?: string | null;
    safety_grade?: string | null;
    status?: string | null;
  } | null;
}

export interface CsmEvaluationCriteriaAverages {
  ppe: number;
  housekeeping: number;
  ptw: number;
  near_miss: number;
  swa: number;
  quality: number;
  schedule: number;
}

export interface CsmContractorScorecardSummary {
  total_evaluations: number;
  rolling_safety_index: number;
  incident_free_percent: number;
  recommend_future_percent: number;
  criteria_averages: CsmEvaluationCriteriaAverages;
  recent_evaluations: CsmPostJobEvaluation[];
}

export interface CsmOshaAuditClauseEvidence {
  standard_clause: string;
  clause_title: string;
  psm_mandate: string;
  compliance_status: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT';
  metrics_summary: Record<string, any>;
  findings: string;
}

export interface CsmOshaAuditPackage {
  standard: string;
  title: string;
  generated_at: string;
  overall_compliance_status: 'COMPLIANT' | 'CONDITIONAL_PASS' | 'NON_COMPLIANT';
  executive_summary: {
    total_evaluated_contractors: number;
    active_credentialed_workers: number;
    rolling_safety_index_average: number;
    total_post_job_evaluations: number;
    open_safety_variances: number;
    total_gate_passes_issued: number;
  };
  regulatory_clauses: CsmOshaAuditClauseEvidence[];
  contractors: any[];
  evaluations: CsmPostJobEvaluation[];
  workers: any[];
  induction_courses: any[];
  gate_passes: any[];
}

export interface CreatePostJobEvaluationPayload {
  contractor_id: string;
  work_order_or_job_number: string;
  evaluation_title: string;
  evaluation_date?: string | undefined;
  work_category?: string | undefined;
  site_id?: string | undefined;
  unit_id?: string | undefined;
  ppe_compliance_score: number;
  housekeeping_score: number;
  ptw_adherence_score: number;
  near_miss_reporting_score: number;
  stop_work_authority_score: number;
  quality_and_craftsmanship_score: number;
  schedule_adherence_score: number;
  safety_incidents_occurred?: boolean | undefined;
  incidents_summary?: string | undefined;
  strengths?: string | undefined;
  improvement_areas?: string | undefined;
  recommend_for_future_work?: boolean | undefined;
  supervisor_signature_name: string;
}

export interface AcknowledgeEvaluationPayload {
  vendor_feedback_comments?: string | undefined;
}

