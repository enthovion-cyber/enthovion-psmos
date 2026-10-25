export type ExecutiveScopeType = 'company' | 'site' | 'department' | 'unit' | 'area' | 'equipment';

export type ExecutivePerformanceStatus =
  | 'Healthy'
  | 'Good'
  | 'Monitor'
  | 'Warning'
  | 'Attention Required'
  | 'High Risk'
  | 'Critical'
  | 'Incomplete'
  | 'Restricted'
  | 'Unavailable'
  | 'Insufficient Data'
  | string;

export type ExecutiveHeatmapCellStatus =
  | 'Healthy'
  | 'Monitor'
  | 'Warning'
  | 'High Risk'
  | 'Critical'
  | 'Restricted'
  | 'Unavailable'
  | 'Insufficient Data'
  | string;

export interface ExecutiveHeatmapCell {
  row_label: string;
  column_label: string;
  scope_type?: string;
  scope_id?: string;
  module_id?: string;
  score_value?: number | null;
  status?: string;
  restricted?: boolean;
  drilldown_route?: string;
  critical_count?: number;
  overdue_count?: number;
}

export interface ExecutiveScopePerformance {
  id: string;
  scope_type: ExecutiveScopeType;
  scope_record_id: string | null;
  scope_label: string;
  site_id: string | null;
  aggregation_run_id: string | null;
  performance_score_foundation: number | null;
  performance_status: string;
  data_quality_status: string;
  critical_alert_count: number;
  overdue_action_count: number;
  pending_approval_count: number;
  stale_record_count: number;
  unavailable_module_count: number;
  insufficient_data_count: number;
  moduleScorecards: Array<Record<string, unknown>>;
  kpiScorecards: Array<Record<string, unknown>>;
  sourceTrace: Array<Record<string, unknown>>;
  reason?: string | null;
  criticalAlerts?: Array<Record<string, unknown>>;
  overdueActions?: Array<Record<string, unknown>>;
  pendingApprovals?: Array<Record<string, unknown>>;
  staleRecords?: Array<Record<string, unknown>>;
  calculated_at?: string | null;
}
export interface ExecutivePerformanceList { rows: ExecutiveScopePerformance[]; total: number; }
export interface ExecutivePerformanceDashboard { company: ExecutiveScopePerformance; sites: ExecutiveScopePerformance[]; summary: Record<string, number | string | null>; }
