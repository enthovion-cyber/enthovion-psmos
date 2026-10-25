export type ExecutiveTrendPoint = {
  id: string;
  trend_series_id?: string;
  trend_run_id?: string;
  period_start_at: string;
  period_end_at: string;
  observation_as_of_at?: string | null;
  metric_value: number | null;
  metric_text_value?: string | null;
  numerator?: number | null;
  denominator?: number | null;
  observation_count: number;
  source_count?: number;
  excluded_count?: number;
  restricted_count?: number;
  point_status: 'Observed' | 'Reconstructed From Verified History' | 'Missing' | 'Insufficient Data' | 'Restricted' | 'Unavailable' | 'Not Comparable';
  data_quality_status: string;
  calculation_method_snapshot_json?: Record<string, unknown>;
  warning_json?: Record<string, unknown> | null;
};

export type ExecutiveTrendSeries = {
  id: string;
  company_id: string;
  site_id?: string | null;
  trend_run_id: string;
  series_code: string;
  series_title: string;
  metric_code: string;
  kpi_definition_id?: string | null;
  source_module?: string | null;
  scope_type: string;
  scope_record_id?: string | null;
  unit?: string | null;
  directionality: 'Higher is better' | 'Lower is better' | 'Target range';
  calculation_type: string;
  data_quality_status: string;
  source_count: number;
  created_at: string;
};

export type ExecutiveTrendRun = {
  id: string;
  company_id: string;
  site_id?: string | null;
  department_id?: string | null;
  unit_id?: string | null;
  run_code: string;
  run_title: string;
  run_type: string;
  run_status: 'Running' | 'Completed' | 'Completed With Warnings' | 'Failed' | 'Cancelled' | 'Archived';
  scope_type: string;
  scope_record_id?: string | null;
  scope_snapshot_json?: Record<string, unknown>;
  filter_json?: Record<string, unknown>;
  date_range_start: string;
  date_range_end: string;
  granularity: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  time_zone: string;
  data_quality_status: string;
  source_record_count: number;
  observation_count: number;
  missing_period_count: number;
  restricted_source_count: number;
  source_coverage_json?: Record<string, unknown>;
  result_summary_json?: {
    source?: string;
    latestValue?: number | null;
    pointCount?: number;
    [key: string]: unknown;
  };
  calculation_warning_json?: Record<string, unknown> | null;
  stale_status: string;
  stale_reason?: string | null;
  supersedes_run_id?: string | null;
  initiated_by?: string | null;
  started_at: string;
  completed_at?: string | null;
  failed_at?: string | null;
  safe_error_summary?: string | null;
  created_at: string;
};

export type ExecutiveTrendLineage = {
  id: string;
  source_module: string;
  source_record_type: string;
  source_record_id: string | null;
  source_observed_at?: string | null;
  source_updated_at?: string | null;
  source_hash?: string | null;
  restricted?: boolean;
};

export type ExecutiveTrendComparison = {
  id: string;
  comparison_type: string;
  baseline_scope_json: Record<string, unknown>;
  comparison_scope_json: Record<string, unknown>;
  baseline_period_json: Record<string, unknown>;
  comparison_period_json: Record<string, unknown>;
  baseline_value: number | null;
  comparison_value: number | null;
  absolute_change: number | null;
  percentage_change: number | null;
  trend_direction: 'Improving' | 'Stable' | 'Declining' | 'Worsening' | 'Insufficient Data' | 'Not Comparable';
  comparability_status: string;
  data_quality_status: string;
  methodology_snapshot_json: Record<string, unknown>;
  explanation_json?: Record<string, unknown> | null;
  created_at: string;
};

export type ExecutiveRepeatIssue = {
  id: string;
  company_id: string;
  site_id?: string | null;
  site_name?: string | null;
  repeat_code: string;
  repeat_title: string;
  repeat_type: string;
  detection_method: string;
  detection_rule_version: string;
  match_basis_json: {
    canonicalIdentityKey?: string;
    dimensions?: string[];
    [key: string]: unknown;
  };
  match_quality_status: string;
  repeat_status: 'Potential Repeat' | 'Needs Review' | 'Confirmed Repeat' | 'Confirmed Cross-Site Repeat' | 'Repeat After CAPA' | 'Recurring Issue' | 'Not Repeat' | 'Duplicate Source Link' | 'Rejected' | 'Archived';
  occurrence_count: number;
  first_occurrence_at?: string | null;
  latest_occurrence_at?: string | null;
  affected_sites_count: number;
  affected_units_count: number;
  primary_source_module?: string | null;
  psm_element_id?: string | null;
  source_criticality?: string | null;
  executive_priority?: 'Critical' | 'High' | 'Medium' | 'Low' | null;
  related_risk_case_id?: string | null;
  related_capa_action_id?: string | null;
  management_review_candidate_id?: string | null;
  owner_user_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_reason?: string | null;
  detected_run_id: string;
  created_at: string;
  updated_at: string;
};

export type ExecutiveRepeatOccurrence = {
  id: string;
  repeat_candidate_id: string;
  source_module: string;
  source_record_type: string;
  source_record_id: string;
  canonical_identity_key: string;
  occurrence_at: string;
  source_classification?: string | null;
  created_at: string;
};

export type ExecutiveRecurringCluster = {
  id: string;
  company_id: string;
  site_id?: string | null;
  cluster_code: string;
  cluster_title: string;
  cluster_type: string;
  cluster_status: 'Open' | 'Under Review' | 'Escalated' | 'Management Review' | 'Resolved' | 'Archived';
  clustering_method: string;
  rule_version: string;
  dimension_config_json?: Record<string, unknown>;
  confirmed_occurrence_count: number;
  affected_sites_count: number;
  affected_units_count: number;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  severity?: string | null;
  trend_direction: string;
  data_quality_status: string;
  owner_user_id?: string | null;
  review_status: string;
  management_review_candidate_id?: string | null;
  created_run_id: string;
  created_at: string;
  updated_at: string;
};

export type ExecutiveTrendInsight = {
  id: string;
  insight_code: string;
  insight_title: string;
  insight_type: string;
  insight_summary: string;
  insight_status: 'Active' | 'Reviewed' | 'Dismissed' | 'Escalated' | 'Resolved';
  trend_run_id: string;
  trend_series_id?: string | null;
  rule_code: string;
  rule_version: string;
  baseline_value?: number | null;
  current_value?: number | null;
  comparison_period_json?: Record<string, unknown> | null;
  data_quality_status: string;
  explanation_json: Record<string, unknown>;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_reason?: string | null;
  management_review_candidate_id?: string | null;
  created_at: string;
};

export type ExecutiveTrendAlertRule = {
  id: string;
  rule_code: string;
  rule_title: string;
  rule_type: string;
  metric_code?: string | null;
  scope_config_json?: Record<string, unknown>;
  trigger_config_json?: Record<string, unknown>;
  minimum_data_quality: string;
  minimum_observation_count: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  notification_enabled: boolean;
  escalation_enabled: boolean;
  management_review_candidate_enabled: boolean;
  active: boolean;
  created_at: string;
};

export type ExecutiveTrendAlert = {
  id: string;
  alert_code: string;
  alert_title: string;
  alert_type: string;
  alert_status: 'Active' | 'Acknowledged' | 'Under Review' | 'Follow-Up Assigned' | 'Escalated' | 'Resolved' | 'Dismissed With Reason';
  alert_severity: 'Critical' | 'High' | 'Medium' | 'Low';
  trend_run_id: string;
  insight_id?: string | null;
  rule_id?: string | null;
  deduplication_key: string;
  trigger_details_json?: Record<string, unknown>;
  data_quality_status: string;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  escalation_id?: string | null;
  management_review_candidate_id?: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolution_reason?: string | null;
};

export type ExecutiveTrendDashboard = {
  scope: Record<string, unknown>;
  generatedAt: string;
  dataQuality: string;
  summary: {
    historicalRuns: number;
    activeRepeatIssues: number;
    activeAlerts: number;
    activeInsights: number;
    criticalRiskObservations: number;
    overdueActionObservations: number;
    escalationObservations: number;
    [key: string]: number | undefined;
  };
  latestRuns: ExecutiveTrendRun[];
  recentAlerts: ExecutiveTrendAlert[];
  insights: ExecutiveTrendInsight[];
  warnings: string[];
};

export type ExecutiveTrendCollection = {
  rows: Array<Record<string, unknown>>;
  total: number;
  dataQuality?: string | undefined;
  source?: string | undefined;
};
