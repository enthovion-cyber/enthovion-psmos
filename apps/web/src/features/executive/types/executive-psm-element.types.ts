export type PsmElementStatus =
  | 'Healthy'
  | 'Monitor'
  | 'Attention Required'
  | 'High Risk'
  | 'Critical'
  | 'Incomplete Data'
  | 'Insufficient Data'
  | 'Restricted'
  | 'Source Unavailable'
  | 'Not Configured';

export type PsmElement = {
  id: string;
  element_code: string;
  element_name: string;
  element_description: string | null;
  element_category: string;
  display_order: number;
  system_defined: boolean;
  active: boolean;
  required_foundation: boolean;
  notes: string | null;
};

export type PsmElementScore = {
  id: string;
  element_id: string;
  element_name: string;
  element_code: string;
  element_category: string;
  score_value: number | null;
  element_status: PsmElementStatus;
  confidence_status: string | null;
  data_quality_status: string;
  critical_item_count: number;
  high_risk_item_count: number;
  overdue_action_count: number;
  missing_evidence_count: number;
  pending_approval_count: number;
  stale_record_count: number;
  restricted_record_count: number;
  unavailable_module_count: number;
  source_module_count: number;
  aggregation_run_id: string | null;
  calculated_at: string | null;
};

export type PsmElementRow = PsmElement & Partial<PsmElementScore>;

export type PsmScoreFactor = {
  id: string;
  factor_key: string;
  factor_title: string;
  factor_value: number | null;
  factor_text_value: string | null;
  factor_status: string;
  factor_weight: number | null;
  factor_contribution: number | null;
  source_module: string | null;
  source_count: number;
};

export type PsmModuleMapping = {
  id: string;
  element_id: string;
  source_module: string;
  source_module_label: string;
  mapping_type: string;
  weight: number | null;
  required_for_score: boolean;
  required_permission: string | null;
  active: boolean;
  notes: string | null;
};

export type PsmKpiMapping = {
  id: string;
  element_id: string;
  kpi_code: string;
  source_module: string | null;
  contribution_type: string;
  weight: number | null;
  required_for_score: boolean;
  active: boolean;
};

export type PsmElementGap = {
  id: string;
  element_id: string;
  gap_title: string;
  gap_type: string;
  source_module: string;
  severity: string;
  gap_status: string;
  due_date: string | null;
  restricted: boolean;
  drilldown_route: string | null;
};

export type PsmSourceTrace = {
  id: string;
  source_module: string;
  source_record_type: string;
  source_record_id: string | null;
  source_title: string | null;
  contribution_type: string | null;
  included: boolean;
  excluded_reason: string | null;
  restricted: boolean;
  severity: string | null;
  status: string | null;
  drilldown_route: string | null;
};

export type PsmElementSnapshot = {
  id: string;
  snapshot_code: string | null;
  snapshot_title: string;
  snapshot_type: string;
  scope_type: string;
  generated_at: string;
  element_count: number;
  healthy_count: number;
  monitor_count: number;
  attention_required_count: number;
  high_risk_count: number;
  critical_count: number;
  incomplete_count: number;
  restricted_count: number;
  archived_at?: string | null;
  score_summary_json?: Array<{ elementId: string; score: number | null; status: string }> | null;
};

export type PsmElementDashboard = {
  summary: {
    totalElements: number;
    healthyElements: number;
    monitorElements: number;
    attentionRequiredElements: number;
    highRiskElements: number;
    criticalElements: number;
    incompleteElements: number;
    restrictedElements: number;
    sourceUnavailableElements: number;
    criticalElementGaps: number;
    overdueElementActions: number;
    staleElementRecords: number;
    missingEvidence: number;
    pendingElementApprovals: number;
    worstElement: string | null;
    bestElement: string | null;
    lastCalculated: string | null;
  };
  scorecards: PsmElementScore[];
  gaps: PsmElementGap[];
  snapshots: PsmElementSnapshot[];
};

export type PsmElementDetail = {
  element: PsmElement;
  score: PsmElementScore;
  modules: PsmModuleMapping[];
  kpis: PsmKpiMapping[];
  factors: PsmScoreFactor[];
  gaps: PsmElementGap[];
  history: Array<{ id: string; event_type: string; event_title: string; event_description: string | null; created_at: string }>;
  sourceTrace: PsmSourceTrace[];
};

export type PsmElementInput = {
  elementCode: string;
  elementName: string;
  elementDescription?: string;
  elementCategory: string;
  displayOrder?: number;
  requiredFoundation?: boolean;
  notes?: string;
};
