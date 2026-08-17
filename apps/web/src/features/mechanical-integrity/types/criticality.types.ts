export type CriticalityCategory = 'Low' | 'Medium' | 'High' | 'Critical' | string;

export type CriticalityAssessment = {
  id: string;
  assessment_number: string;
  assessment_type: string;
  assessment_reason: string;
  assessment_date: string;
  status: string;
  approval_status: string;
  revision_number: number;
  equipment_id: string;
  equipmentTag?: string | null;
  equipmentName?: string | null;
  equipmentType?: string | null;
  consequence_score?: number | null;
  likelihood_score?: number | null;
  final_risk_score?: number | null;
  risk_matrix_cell?: string | null;
  criticality_category?: CriticalityCategory | null;
  inspection_priority?: string | null;
  safety_critical?: boolean;
  psm_critical?: boolean;
  startup_blocker_potential?: boolean;
  calculation_status?: string;
  next_review_due?: string | null;
  risk_change_direction?: string | null;
  readOnly?: boolean;
};

export type CriticalityScore = {
  id: string;
  assessment_id: string;
  dimension_key: string;
  dimension_label: string;
  score?: number | null;
  score_label?: string | null;
  description?: string | null;
  justification?: string | null;
  data_source?: string | null;
  auto_suggested_score?: number | null;
  manual_override_score?: number | null;
  override_reason?: string | null;
  weight?: number | null;
  required?: boolean;
};

export type CriticalityCalculation = {
  id?: string;
  consequence_score?: number | null;
  likelihood_score?: number | null;
  final_risk_score?: number | null;
  risk_matrix_cell?: string | null;
  criticality_category?: string | null;
  inspection_priority?: string | null;
  explanation?: string | null;
  calculation_status?: string | null;
  next_review_due?: string | null;
  calculation_inputs_json?: Record<string, unknown>;
  calculation_outputs_json?: Record<string, unknown>;
};

export type CriticalityRegistryResponse = {
  rows: CriticalityAssessment[];
  summary: Record<string, unknown>;
  filters: Record<string, string | undefined>;
  lastUpdated: string;
};

export type CriticalityAssessmentDetail = {
  assessment: CriticalityAssessment & Record<string, unknown>;
  consequenceScores: CriticalityScore[];
  likelihoodScores: CriticalityScore[];
  calculation: CriticalityCalculation | null;
  history: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  validation: { blockers: string[]; warnings: string[]; readyForReview: boolean; readyForApproval: boolean };
  actions: Array<{ key: string; permitted: boolean; disabled: boolean; disabledReason?: string | null }>;
};

export type EquipmentCriticalityResponse = {
  equipment: Record<string, unknown>;
  current: CriticalityAssessment | null;
  history: CriticalityAssessment[];
  snapshot: Record<string, unknown>;
  suggestions: Record<string, unknown>;
  summary: Record<string, unknown>;
};
