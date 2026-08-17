export type MiInspectionRecordStatus = 'Draft' | 'In Progress' | 'Submitted for Review' | 'Returned for Correction' | 'Approved' | 'Rejected' | 'Superseded' | 'Archived' | string;

export interface MiInspectionRecord {
  id: string;
  company_id?: string;
  site_id?: string;
  equipment_id: string;
  plan_id?: string | null;
  occurrence_id?: string | null;
  inspection_number: string;
  inspection_type: string;
  inspection_method?: string | null;
  planned?: boolean;
  unplanned_reason?: string | null;
  status: MiInspectionRecordStatus;
  review_status?: string | null;
  result?: string | null;
  inspection_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  inspector_user_id?: string | null;
  inspector_name?: string | null;
  inspector_qualification?: string | null;
  inspection_vendor?: string | null;
  reviewer_user_id?: string | null;
  responsible_engineer_id?: string | null;
  online_offline_status?: string | null;
  shutdown_required?: boolean;
  entry_required?: boolean;
  confined_space_permit_id?: string | null;
  ptw_id?: string | null;
  loto_id?: string | null;
  procedure_document_id?: string | null;
  instrument_used?: string | null;
  instrument_serial_number?: string | null;
  instrument_calibration_document_id?: string | null;
  notes?: string | null;
  remaining_life_updated?: boolean;
  next_due_updated?: boolean;
  submitted_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  equipmentTag?: string | null;
  equipmentName?: string | null;
  equipmentType?: string | null;
  readingsCount?: number;
  findingsCount?: number;
  criticalFindingsCount?: number;
  checklistComplete?: number;
  checklistTotal?: number;
  validationStatus?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MiInspectionRecordSummary {
  total?: number;
  draft?: number;
  inProgress?: number;
  submitted?: number;
  approved?: number;
  rejected?: number;
  archived?: number;
  readings?: number;
  findings?: number;
  criticalFindings?: number;
  checklistOpen?: number;
  remainingLifeUpdated?: number;
  nextDueUpdated?: number;
}

export interface MiInspectionRecordRegistryResponse {
  rows: MiInspectionRecord[];
  summary: MiInspectionRecordSummary;
  page?: number;
  limit?: number;
  total?: number;
}

export interface MiInspectionChecklistItem {
  id: string;
  inspection_record_id: string;
  item_number?: string | null;
  item_title: string;
  item_description?: string | null;
  response_type?: string | null;
  required?: boolean;
  pass_fail?: string | null;
  response_value_json?: unknown;
  comment?: string | null;
  evidence_document_id?: string | null;
  completed_by?: string | null;
  completed_at?: string | null;
  sort_order?: number;
}

export interface MiInspectionReading {
  id: string;
  inspection_record_id?: string | null;
  equipment_id: string;
  cml_id: string;
  cmlNumber?: string | null;
  locationDescription?: string | null;
  componentType?: string | null;
  reading_date?: string | null;
  current_thickness?: number | null;
  thickness_unit?: string | null;
  normalized_thickness?: number | null;
  previous_approved_thickness?: number | null;
  original_thickness?: number | null;
  minimum_required_thickness?: number | null;
  alert_thickness?: number | null;
  retirement_thickness?: number | null;
  reading_status?: string | null;
  review_status?: string | null;
  not_inspected?: boolean;
  not_inspected_reason?: string | null;
  not_accessible?: boolean;
  not_accessible_reason?: string | null;
  inspector_name?: string | null;
  surface_condition?: string | null;
  scan_direction?: string | null;
  measurement_point_label?: string | null;
  notes?: string | null;
  calculation_status?: string | null;
  alert_state?: string | null;
}

export interface MiRemainingLifeEvaluation {
  id?: string;
  equipment_id?: string;
  cml_id: string;
  cml?: { cml_number?: string | null; location_description?: string | null; component_type?: string | null } | null;
  cmlNumber?: string | null;
  current_thickness?: number | null;
  current_reading_date?: string | null;
  minimum_required_thickness?: number | null;
  short_term_corrosion_rate?: number | null;
  long_term_corrosion_rate?: number | null;
  governing_corrosion_rate?: number | null;
  governing_rate_method?: string | null;
  remaining_life_years?: number | null;
  half_life_interval_years?: number | null;
  half_life_due_date?: string | null;
  alert_state?: string | null;
  evaluation_status?: string | null;
  official?: boolean;
  calculated_at?: string | null;
}

export interface MiRemainingLifeSummary {
  rows?: MiRemainingLifeEvaluation[];
  latest?: MiRemainingLifeEvaluation | null;
  summary?: {
    cmlCount?: number;
    criticalCount?: number;
    alertCount?: number;
    shortestRemainingLifeYears?: number | null;
    nextHalfLifeDueDate?: string | null;
  };
}

export interface MiInspectionFinding {
  id: string;
  inspection_record_id?: string | null;
  equipment_id: string;
  cml_id?: string | null;
  cml?: { cml_number?: string | null } | null;
  finding_number?: string | null;
  finding_type: string;
  severity: string;
  title: string;
  description?: string | null;
  location_description?: string | null;
  immediate_action_required?: boolean;
  repair_required?: boolean;
  engineering_review_required?: boolean;
  deficiency_required?: boolean;
  recommended_action?: string | null;
  due_date?: string | null;
  owner_user_id?: string | null;
  status?: string | null;
  linked_action_id?: string | null;
  linked_deficiency_id?: string | null;
  created_at?: string | null;
}

export interface MiInspectionDocument {
  id: string;
  document_id?: string | null;
  file_id?: string | null;
  document_type?: string | null;
  title: string;
  version?: string | null;
  status?: string | null;
  linked_at?: string | null;
}

export interface MiInspectionReview {
  id: string;
  reviewer_user_id?: string | null;
  review_action: string;
  review_comments?: string | null;
  critical_alerts_acknowledged?: boolean;
  findings_acknowledged?: boolean;
  created_at?: string | null;
}

export interface MiInspectionRecordDetail {
  record: MiInspectionRecord;
  checklist: MiInspectionChecklistItem[];
  readings: MiInspectionReading[];
  findings: MiInspectionFinding[];
  documents: MiInspectionDocument[];
  reviews: MiInspectionReview[];
  calculations: MiRemainingLifeSummary;
  validation: { blockers: string[]; warnings: string[]; readyForReview?: boolean };
  actions: Array<{ key: string; label: string; disabled?: boolean; reason?: string }>;
  readOnly?: boolean;
  readOnlyReason?: string | null;
}

export interface MiInspectionLookups {
  inspectionRecordStatuses: string[];
  inspectionResults: string[];
  readingStatuses: string[];
  findingTypes: string[];
  findingSeverities: string[];
  surfaceConditions: string[];
  scanDirections: string[];
}
