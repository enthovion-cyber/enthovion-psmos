export type TrainingFinalSummary = {
  complianceScore?: number | null;
  complianceStatus?: string | null;
  totalWorkers?: number;
  safetyCriticalGaps?: number;
  openGaps?: number;
  overdue?: number;
  expired?: number;
  pendingApprovals?: number;
  dataQualityIssues?: number;
  integrationWarnings?: number;
  hardeningFailures?: number;
  routeCount?: number;
  permissionGroupsCovered?: number;
};

export type TrainingFinalIntegrationDashboard = {
  header: { title: string; subtitle: string; lastUpdated: string };
  summary: TrainingFinalSummary;
  compliance: Record<string, any>;
  snapshots: Array<Record<string, any>>;
  integrationHealth: Array<Record<string, any>>;
  dataQualityIssues: Array<Record<string, any>>;
  hardeningChecks: Array<Record<string, any>>;
  routeHealth: Array<Record<string, any>>;
  permissionAudit: Array<Record<string, any>>;
  generatedAt: string;
};

export type TrainingFinalSettings = {
  id?: string;
  company_id?: string;
  site_id?: string | null;
  enable_compliance_snapshots?: boolean;
  enable_integration_health_checks?: boolean;
  enable_data_quality_checks?: boolean;
  enable_auto_recalculate_on_training_change?: boolean;
  enable_auto_recalculate_on_certificate_expiry?: boolean;
  enable_auto_recalculate_on_sop_revision?: boolean;
  enable_auto_recalculate_on_moc_pssr_change?: boolean;
  enable_auto_ptw_authorization_recheck?: boolean;
  enable_final_audit_mode?: boolean;
  dashboard_cache_ttl_seconds?: number;
  large_export_async_threshold_rows?: number;
  settings_json?: Record<string, any>;
};
