import type { RegulatoryBreakdown, RegulatoryHistoryEvent, RegulatoryItem, RegulatoryUser } from './regulatory.types';
import type { RegulatoryObligation } from './regulatory-obligation.types';

export type RegulatoryComplianceAssessment = {
  id: string;
  company_id?: string | null;
  site_id?: string | null;
  department_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  regulatory_item_id?: string | null;
  obligation_id?: string | null;
  jurisdiction_id?: string | null;
  authority_id?: string | null;
  assessment_number?: string | null;
  assessment_title?: string | null;
  source_type?: string | null;
  source_record_id?: string | null;
  source_title?: string | null;
  source_snapshot_json?: Record<string, unknown> | null;
  assessment_status?: string | null;
  compliance_status?: string | null;
  gap_status?: string | null;
  evidence_readiness_status?: string | null;
  criteria_status?: string | null;
  stale_status?: string | null;
  stale_reason?: string | null;
  applicability_status_snapshot?: string | null;
  criticality?: string | null;
  category?: string | null;
  related_psm_element?: string | null;
  owner_user_id?: string | null;
  assessor_user_id?: string | null;
  reviewer_user_id?: string | null;
  review_required?: boolean | null;
  review_status?: string | null;
  manual_declaration?: boolean | null;
  manual_declaration_reason?: string | null;
  status_rationale?: string | null;
  decision_basis?: string | null;
  next_review_date?: string | null;
  last_assessed_at?: string | null;
  completed_at?: string | null;
  submitted_for_review_at?: string | null;
  owner_label?: string | null;
  assessor_label?: string | null;
  reviewer_label?: string | null;
  source_label?: string | null;
  gap_count?: number | null;
  critical_gap_count?: number | null;
  action_count?: number | null;
  capa_count?: number | null;
  owner?: RegulatoryUser | null;
  assessor?: RegulatoryUser | null;
  reviewer?: RegulatoryUser | null;
  item?: RegulatoryItem | null;
  obligation?: RegulatoryObligation | null;
  readOnly?: boolean | null;
  readOnlyReason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RegulatoryComplianceGap = {
  id: string;
  assessment_id?: string | null;
  regulatory_item_id?: string | null;
  obligation_id?: string | null;
  gap_number?: string | null;
  gap_type?: string | null;
  gap_title?: string | null;
  gap_description?: string | null;
  gap_status?: string | null;
  severity?: string | null;
  criticality?: string | null;
  impact_type?: string | null;
  owner_user_id?: string | null;
  due_date?: string | null;
  recommended_fix?: string | null;
  action_required?: boolean | null;
  action_id?: string | null;
  capa_required?: boolean | null;
  capa_id?: string | null;
  evidence_required?: boolean | null;
  review_required?: boolean | null;
  resolution_note?: string | null;
  updated_at?: string | null;
};

export type RegulatoryComplianceCriterion = {
  id: string;
  criterion_number?: number | null;
  criterion_title?: string | null;
  criterion_description?: string | null;
  expected_condition?: string | null;
  evaluation_method?: string | null;
  result_status?: string | null;
  rationale?: string | null;
  evidence_required?: boolean | null;
  blocking?: boolean | null;
};

export type RegulatoryComplianceEvidenceReadiness = {
  id: string;
  evidence_type?: string | null;
  evidence_description?: string | null;
  required?: boolean | null;
  linked_module?: string | null;
  linked_record_type?: string | null;
  linked_record_id?: string | null;
  readiness_status?: string | null;
  missing_reason?: string | null;
  restricted?: boolean | null;
};

export type RegulatoryComplianceReadiness = {
  status?: string | null;
  ready?: boolean | null;
  generatedAt?: string | null;
  blockers?: Array<{ key?: string; label?: string; blocking?: boolean; count?: number }>;
};

export type RegulatoryComplianceRegister = {
  rows: RegulatoryComplianceAssessment[];
  allRows?: RegulatoryComplianceAssessment[];
  total: number;
  page: number;
  limit: number;
  hasMore?: boolean;
  summary?: Record<string, number>;
};

export type RegulatoryComplianceDashboard = {
  header?: { title?: string; subtitle?: string; generatedAt?: string };
  summary?: Record<string, number>;
  bySite?: RegulatoryBreakdown[];
  byUnit?: RegulatoryBreakdown[];
  byCategory?: RegulatoryBreakdown[];
  byJurisdiction?: RegulatoryBreakdown[];
  byOwner?: RegulatoryBreakdown[];
  byStatus?: RegulatoryBreakdown[];
  byEvidenceReadiness?: RegulatoryBreakdown[];
  byAssessmentStatus?: RegulatoryBreakdown[];
  byCriticality?: RegulatoryBreakdown[];
  criticalNonCompliantPreview?: RegulatoryComplianceAssessment[];
  evidenceMissingPreview?: RegulatoryComplianceAssessment[];
  actionRequiredPreview?: RegulatoryComplianceAssessment[];
  openGapPreview?: RegulatoryComplianceGap[];
  stalePreview?: RegulatoryComplianceAssessment[];
  recentAssessments?: RegulatoryComplianceAssessment[];
  readinessSummary?: RegulatoryComplianceReadiness;
};

export type RegulatoryComplianceDetail = {
  assessment: RegulatoryComplianceAssessment;
  source?: RegulatoryItem | RegulatoryObligation | null;
  overview?: { cards?: Record<string, unknown> };
  criteria?: { rows: RegulatoryComplianceCriterion[]; total?: number };
  evidenceReadiness?: { rows: RegulatoryComplianceEvidenceReadiness[]; total?: number; summary?: RegulatoryBreakdown[] };
  gaps?: { rows: RegulatoryComplianceGap[]; total?: number };
  actions?: { rows: RegulatoryComplianceGap[]; total?: number };
  decision?: Record<string, unknown>;
  history?: { rows: RegulatoryHistoryEvent[]; summary?: Record<string, unknown> };
  readiness?: RegulatoryComplianceReadiness;
  readOnly?: boolean;
  readOnlyReason?: string | null;
};

export type RegulatoryComplianceLookups = {
  complianceStatuses: string[];
  complianceAssessmentStatuses: string[];
  complianceEvidenceReadinessStatuses: string[];
  complianceCriteriaStatuses: string[];
  complianceGapTypes: string[];
  complianceGapStatuses: string[];
  complianceGapSeverities: string[];
  complianceStaleStatuses: string[];
  complianceSourceTypes: string[];
  criticalityLevels: string[];
};
