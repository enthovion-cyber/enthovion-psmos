export type AuditTrendRun = {
  id: string;
  trend_code: string;
  trend_title: string;
  trend_type: string;
  trend_status: string;
  readiness_status: string;
  stale_status: string;
  stale_reason?: string | null;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  source_modules_json?: string[];
  time_period_start: string;
  time_period_end: string;
  compare_period_start?: string | null;
  compare_period_end?: string | null;
  filters_json?: Record<string, unknown> | null;
  methodology_snapshot_json?: Record<string, unknown> | null;
  input_snapshot_json?: Record<string, unknown> | null;
  calculation_trace_json?: Record<string, unknown> | null;
  result_summary_json?: Record<string, unknown> | null;
  calculated_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditTrendResult = {
  id: string;
  trend_run_id: string;
  result_title: string;
  result_category: string;
  trend_direction: string;
  confidence: string;
  severity?: string | null;
  criticality?: string | null;
  source_count: number;
  matched_records_json?: Array<Record<string, unknown>> | null;
  key_drivers_json?: Record<string, unknown> | null;
  supporting_records_json?: Array<Record<string, unknown>> | null;
  recommended_follow_up?: string | null;
  report_ready: boolean;
  result_status: string;
};

export type AuditTrendRunList = {
  rows: AuditTrendRun[];
  total: number;
  page: number;
  limit: number;
};

export type AuditTrendRunDetail = {
  trendRun: AuditTrendRun;
  results: AuditTrendResult[];
  sourceRecords: Array<Record<string, unknown>>;
  metrics: Array<Record<string, unknown>>;
  staleness: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  inputSnapshot: Record<string, unknown>;
  methodologySnapshot: Record<string, unknown>;
  calculationTrace: Record<string, unknown>;
  explainability: Record<string, unknown>;
  actionsFoundation: Array<Record<string, unknown>>;
};

export type AuditRepeatFindingMatch = {
  id: string;
  source_finding_id: string;
  matched_finding_id: string;
  repeat_status: string;
  match_status: string;
  match_strength?: number | null;
  match_criteria_json?: Record<string, unknown>;
  match_explanation?: string | null;
  recurrence_count: number;
  first_occurrence_at?: string | null;
  latest_occurrence_at?: string | null;
  review_decision?: string | null;
  review_reason?: string | null;
};

export type AuditRepeatFindingList = {
  rows: AuditRepeatFindingMatch[];
  total: number;
  page: number;
  limit: number;
};
