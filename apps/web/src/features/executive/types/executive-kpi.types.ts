export type ExecutiveStatus = 'Good' | 'Monitor' | 'Warning' | 'High Risk' | 'Critical' | 'Attention Required' | 'Incomplete' | 'Incomplete Data' | 'Restricted' | 'Unavailable' | 'Error' | string;

export interface ExecutiveKpiResult {
  id: string;
  definitionId: string;
  kpiCode: string;
  title: string;
  category: string;
  sourceModule: string;
  value: number | null;
  textValue: string | null;
  displayValue?: string | number;
  unit?: string | null;
  status: ExecutiveStatus;
  thresholdStatus: string;
  trendStatus: string;
  confidenceStatus: string;
  sourceCount: number;
  overdueCount?: number;
  staleCount?: number;
  calculatedAt: string;
  drilldownRoute?: string | null;
  sourceTrace?: Record<string, unknown>;
}

export interface ExecutiveSourceHealth {
  sourceModule: string;
  title: string;
  adapterStatus: ExecutiveStatus;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  recordsIncluded: number;
  recordsExcluded?: number;
  restrictedRecords: number | null;
  warningCount: number;
  errorCount: number;
  safeErrorMessage?: string | null;
  route?: string | null;
}

export interface ExecutiveModuleHealth {
  moduleKey: string;
  moduleName: string;
  healthStatus: ExecutiveStatus;
  healthScoreFoundation?: number | null;
  criticalOpenItems: number;
  overdueItems: number;
  pendingApprovals: number | null;
  staleRecords: number;
  lastUpdated?: string | null;
  dataQuality: ExecutiveStatus;
  drilldownRoute?: string | null;
  reason?: string | null;
}

export interface ExecutiveSitePerformance {
  siteId: string;
  siteName: string;
  overallHealth: ExecutiveStatus;
  criticalItems: number;
  overdueActions: number | null;
  regulatoryGaps: number | null;
  trainingCompliance: number | null;
  miOverdue: number | null;
  pendingReviews: number | null;
  staleRecords: number | null;
  lastUpdated?: string | null;
  route: string;
}

export interface ExecutiveAlert {
  title: string;
  sourceModule: string;
  sourceRecord?: string | null;
  severity: ExecutiveStatus;
  owner?: string | null;
  dueDate?: string | null;
  status: ExecutiveStatus;
  rankingMethod?: string;
  drilldownRoute?: string | null;
  message?: string;
}

export interface ExecutiveDashboard {
  header: { companyId: string; selectedSiteId?: string | null; lastRefreshedAt?: string; lastAggregationRun?: string | null; score: number | null; status: ExecutiveStatus; reason?: string | null; stale?: boolean; criticalAlertsCount?: number; overdueActionCount?: number; staleCriticalRecordCount?: number; pendingApprovalCount?: number; dataQualityStatus?: ExecutiveStatus };
  summaryCards: ExecutiveKpiResult[];
  criticalAlerts: ExecutiveAlert[];
  moduleHealth: ExecutiveModuleHealth[];
  sitePerformance: ExecutiveSitePerformance[];
  openCriticalActions: ExecutiveAlert[];
  pendingApprovals: ExecutiveAlert[];
  staleRecords: ExecutiveAlert[];
  regulatoryAuditCompliance: ExecutiveKpiResult[];
  incidentMiTraining: ExecutiveKpiResult[];
  managementReview: ExecutiveKpiResult[];
  sourceHealth: ExecutiveSourceHealth[];
  recentSnapshot?: { id: string; snapshot_code: string; snapshot_title: string; generated_at: string; overall_status: ExecutiveStatus } | null;
  aggregationWarning?: string;
}

export interface ExecutiveAggregationRun { id: string; run_code: string | null; run_type: string; run_status: string; site_id: string | null; started_at: string; completed_at: string | null; source_count: number; warning_count: number; error_count: number; duration_ms?: number | null; safe_error_summary?: string | null; }
export interface ExecutiveCriticalAlert { id: string; alert_title: string; source_module: string; source_record_type: string; source_record_id?: string | null; severity: string; alert_status: string; alert_reason: string; ranking_score?: number | null; due_date?: string | null; restricted?: boolean; safe_placeholder?: boolean; drilldown_route?: string | null; }
export interface ExecutiveModuleHealthDetail { module: ExecutiveModuleHealth; criticalItems: Array<Record<string, unknown>>; overdueItems: Array<Record<string, unknown>>; pendingApprovals: Array<Record<string, unknown>>; staleRecords: Array<Record<string, unknown>>; sourceTrace: Array<Record<string, unknown>>; calculationMethod: Record<string, unknown> | null; }
export interface ExecutiveAggregationRunDetail { run: ExecutiveAggregationRun; moduleHealth: ExecutiveModuleHealth[]; criticalAlerts: ExecutiveCriticalAlert[]; sourceRecords: Array<Record<string, unknown>>; errors: Array<Record<string, unknown>>; dashboard: ExecutiveDashboard; }

export interface ExecutiveKpiDefinition { id: string; kpi_code: string; kpi_title: string; kpi_category: string; source_module: string; calculation_method: string; directionality: string; drilldown_route?: string | null; active: boolean; system_defined: boolean; }
