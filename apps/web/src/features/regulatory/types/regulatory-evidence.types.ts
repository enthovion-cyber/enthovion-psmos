import type { RegulatoryBreakdown, RegulatoryHistoryEvent, RegulatoryItem } from './regulatory.types';
import type { RegulatoryObligation } from './regulatory-obligation.types';

export type RegulatoryEvidenceRequirement = {
  id: string;
  company_id?: string | null;
  site_id?: string | null;
  department_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  requirement_code?: string | null;
  requirement_title?: string | null;
  source_type?: string | null;
  regulatory_item_id?: string | null;
  obligation_id?: string | null;
  compliance_assessment_id?: string | null;
  compliance_gap_id?: string | null;
  applicability_assessment_id?: string | null;
  evidence_type_expected?: string | null;
  evidence_description?: string | null;
  evidence_frequency?: string | null;
  evidence_owner_user_id?: string | null;
  reviewer_user_id?: string | null;
  due_date?: string | null;
  required_document_type?: string | null;
  required_record_type?: string | null;
  evidence_source_module?: string | null;
  acceptance_criteria_foundation?: string | null;
  retention_requirement_foundation?: string | null;
  confidentiality_level?: string | null;
  restricted_by_default?: boolean | null;
  requirement_status?: string | null;
  criticality?: string | null;
  notes?: string | null;
  item?: RegulatoryItem | null;
  obligation?: RegulatoryObligation | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RegulatoryEvidenceLink = {
  id: string;
  company_id?: string | null;
  site_id?: string | null;
  department_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  evidence_code?: string | null;
  evidence_title?: string | null;
  evidence_type?: string | null;
  evidence_status?: string | null;
  review_status?: string | null;
  readiness_status?: string | null;
  stale_status?: string | null;
  stale_reason?: string | null;
  source_type?: string | null;
  regulatory_item_id?: string | null;
  obligation_id?: string | null;
  evidence_requirement_id?: string | null;
  compliance_assessment_id?: string | null;
  compliance_gap_id?: string | null;
  applicability_assessment_id?: string | null;
  source_module?: string | null;
  source_object_type?: string | null;
  source_record_id?: string | null;
  source_snapshot_json?: Record<string, unknown> | null;
  document_id?: string | null;
  document_version?: string | null;
  storage_file_id?: string | null;
  audit_evidence_id?: string | null;
  external_reference_url?: string | null;
  external_reference_description?: string | null;
  version?: string | null;
  effective_date?: string | null;
  expiry_date?: string | null;
  review_date?: string | null;
  confidentiality_level?: string | null;
  restricted?: boolean | null;
  restricted_reason?: string | null;
  redacted?: boolean | null;
  personal_data_flag_foundation?: boolean | null;
  legal_sensitive_flag_foundation?: boolean | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_comment?: string | null;
  rejection_reason?: string | null;
  rework_instructions?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  notes?: string | null;
  requirement?: RegulatoryEvidenceRequirement | null;
  item?: RegulatoryItem | null;
  obligation?: RegulatoryObligation | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RegulatoryEvidenceRequest = {
  id: string;
  site_id?: string | null;
  request_code?: string | null;
  request_title?: string | null;
  source_type?: string | null;
  request_status?: string | null;
  requested_from_user_id?: string | null;
  requested_by?: string | null;
  requested_at?: string | null;
  due_date?: string | null;
  priority?: string | null;
  request_message?: string | null;
  response_note?: string | null;
  fulfilled_evidence_link_id?: string | null;
  fulfilled_at?: string | null;
};

export type RegulatoryEvidenceGap = {
  id: string;
  site_id?: string | null;
  gap_code?: string | null;
  gap_title?: string | null;
  gap_type?: string | null;
  gap_description?: string | null;
  gap_status?: string | null;
  gap_severity?: string | null;
  criticality?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  recommended_fix?: string | null;
  action_id?: string | null;
  resolution_note?: string | null;
  evidence_requirement_id?: string | null;
  evidence_link_id?: string | null;
};

export type RegulatoryEvidencePackage = {
  id: string;
  site_id?: string | null;
  package_code?: string | null;
  package_title?: string | null;
  package_type?: string | null;
  package_status?: string | null;
  scope_json?: Record<string, unknown> | null;
  manifest_json?: Array<Record<string, unknown>> | null;
  included_evidence_count?: number | null;
  excluded_evidence_count?: number | null;
  restricted_evidence_count?: number | null;
  owner_user_id?: string | null;
  prepared_at?: string | null;
  stale_status?: string | null;
  notes?: string | null;
};

export type RegulatoryEvidenceAccessEvent = {
  id: string;
  evidence_link_id?: string | null;
  access_type?: string | null;
  access_status?: string | null;
  accessed_by?: string | null;
  accessed_at?: string | null;
  denied_reason?: string | null;
};

export type RegulatoryEvidenceRegister = {
  rows: RegulatoryEvidenceLink[];
  allRows?: RegulatoryEvidenceLink[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  summary?: Record<string, number>;
};

export type RegulatoryEvidenceDashboard = {
  header?: { title?: string; subtitle?: string; generatedAt?: string };
  summary?: Record<string, number>;
  bySite?: RegulatoryBreakdown[];
  byUnit?: RegulatoryBreakdown[];
  byObligation?: RegulatoryBreakdown[];
  byStatus?: RegulatoryBreakdown[];
  bySourceModule?: RegulatoryBreakdown[];
  byEvidenceType?: RegulatoryBreakdown[];
  byReviewStatus?: RegulatoryBreakdown[];
  byReadiness?: RegulatoryBreakdown[];
  missingPreview?: RegulatoryEvidenceLink[];
  pendingReviewPreview?: RegulatoryEvidenceLink[];
  stalePreview?: RegulatoryEvidenceLink[];
  openGapPreview?: RegulatoryEvidenceGap[];
  openRequestPreview?: RegulatoryEvidenceRequest[];
  packagePreview?: RegulatoryEvidencePackage[];
  recentEvidence?: RegulatoryEvidenceLink[];
  recentAccess?: RegulatoryEvidenceAccessEvent[];
};

export type RegulatoryEvidenceLookups = {
  evidenceSourceTypes: string[];
  evidenceTypes: string[];
  evidenceStatuses: string[];
  evidenceReviewStatuses: string[];
  evidenceReadinessStatuses: string[];
  evidenceSourceModules: string[];
  evidenceRequirementStatuses: string[];
  evidenceGapTypes: string[];
  evidencePackageTypes: string[];
  evidencePackageStatuses: string[];
  evidenceConfidentialityLevels: string[];
  evidenceStaleStatuses: string[];
  criticalityLevels: string[];
};

export type RegulatoryEvidenceDetail = {
  evidence?: RegulatoryEvidenceLink;
  preview?: unknown;
  download?: unknown;
  message?: string;
};

export type RegulatoryEvidencePackageDetail = {
  package: RegulatoryEvidencePackage;
  items?: Array<Record<string, unknown>>;
};

export type RegulatoryEvidenceHistoryResponse = {
  rows: RegulatoryHistoryEvent[];
  summary?: Record<string, unknown>;
};
