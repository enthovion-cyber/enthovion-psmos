export type ExecutiveReportStatus =
  | 'Draft'
  | 'Under Review'
  | 'Ready'
  | 'Approved'
  | 'Published'
  | 'Archived'
  | 'Stale';

export type ExecutiveReportReadinessStatus =
  | 'Ready'
  | 'Ready With Warnings'
  | 'Not Ready'
  | 'Source Data Missing'
  | 'Not Validated';

export type ExecutiveReportApprovalStatus =
  | 'Not Requested'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected';

export type ExecutiveReportPublicationStatus =
  | 'Not Published'
  | 'Draft'
  | 'Published'
  | 'Superseded'
  | 'Withdrawn';

export type ExecutiveReportConfidentiality =
  | 'Public'
  | 'Internal'
  | 'Confidential'
  | 'Restricted'
  | 'Board Confidential';

export type ExecutiveReportFormat = 'PDF' | 'XLSX' | 'CSV' | 'PPTX' | 'ZIP';

export interface ExecutiveReport {
  id: string;
  company_id: string;
  site_id?: string | null;
  report_code: string;
  report_title: string;
  report_type_id?: string | null;
  template_id?: string | null;
  reporting_period_id?: string | null;
  audience_profile_id?: string | null;
  report_status: ExecutiveReportStatus;
  confidentiality: ExecutiveReportConfidentiality;
  scope_snapshot_json?: Record<string, any>;
  current_version_id?: string | null;
  owner_user_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  archive_reason?: string | null;
}

export interface ExecutiveReportVersion {
  id: string;
  company_id: string;
  report_id: string;
  version_number: number;
  version_status: string;
  template_version_id?: string | null;
  scope_snapshot_json?: Record<string, any>;
  period_snapshot_json?: Record<string, any>;
  source_cut_off_at: string;
  readiness_status: ExecutiveReportReadinessStatus;
  readiness_summary_json?: {
    warnings?: string[];
    validatedAt?: string;
    sourceCount?: number;
  };
  approval_status: ExecutiveReportApprovalStatus;
  publication_status: ExecutiveReportPublicationStatus;
  sealed_at?: string | null;
  sealed_by?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExecutiveReportType {
  id: string;
  company_id?: string | null;
  report_type_code: string;
  report_type_name: string;
  description?: string | null;
  default_classification: ExecutiveReportConfidentiality;
  active: boolean;
  system_defined?: boolean;
}

export interface ExecutiveReportTemplate {
  id: string;
  company_id: string;
  report_type_id?: string | null;
  template_code: string;
  template_name: string;
  template_status: string;
  confidentiality_default: ExecutiveReportConfidentiality;
  active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExecutiveReportingPeriod {
  id: string;
  company_id: string;
  site_id?: string | null;
  period_code: string;
  period_name: string;
  period_type: string;
  starts_at: string;
  ends_at: string;
  cut_off_at: string;
  status: string;
  created_at?: string;
}

export interface ExecutiveReportAudience {
  id: string;
  company_id: string;
  profile_code: string;
  profile_name: string;
  description?: string | null;
  classification: ExecutiveReportConfidentiality;
  recipient_rules_json?: Record<string, any>;
  active: boolean;
}

export interface ExecutiveReportArtifact {
  id: string;
  company_id: string;
  report_version_id: string;
  artifact_format: ExecutiveReportFormat;
  artifact_status: 'Queued' | 'Generating' | 'Completed' | 'Failed';
  document_id?: string | null;
  checksum?: string | null;
  generated_by?: string | null;
  generated_at?: string | null;
  created_at: string;
}

export interface ExecutiveReportSourceManifest {
  id: string;
  company_id: string;
  report_version_id: string;
  manifest_status: ExecutiveReportReadinessStatus;
  cut_off_at: string;
  source_summary_json?: {
    sources?: Array<{ label: string; table: string; count: number }>;
    warnings?: string[];
  };
  validated_at?: string | null;
  validated_by?: string | null;
}

export interface ExecutiveReportManifestItem {
  id: string;
  manifest_id: string;
  source_module: string;
  source_record_type: string;
  source_record_id?: string | null;
  source_snapshot_id?: string | null;
  observed_at?: string | null;
  source_updated_at?: string | null;
  inclusion_status: 'Included' | 'Excluded' | 'Redacted';
  lineage_json?: Record<string, any>;
}

export interface ExecutiveReportSchedule {
  id: string;
  company_id: string;
  template_id?: string | null;
  schedule_name: string;
  schedule_expression: string;
  scope_json?: Record<string, any>;
  active: boolean;
  next_run_at?: string | null;
}

export interface ExecutiveReportDistribution {
  id: string;
  company_id: string;
  report_version_id: string;
  release_variant_id?: string | null;
  distribution_status: string;
  distributed_by?: string | null;
  distributed_at?: string | null;
  created_at: string;
}

export interface ExecutiveReportDashboardSummary {
  totalReports: number;
  drafts: number;
  pendingApproval: number;
  published: number;
  boardPackages: number;
  staleVersions: number;
  activeSchedules: number;
  completedArtifacts: number;
  averageReadinessRate: number;
}

export interface ExecutiveReportDashboard {
  scope: Record<string, any>;
  summary: ExecutiveReportDashboardSummary;
  recentReports: ExecutiveReport[];
  pendingApproval: ExecutiveReportVersion[];
  stale: Array<Record<string, any>>;
  upcomingSchedules: ExecutiveReportSchedule[];
}

export interface ExecutiveBoardDashboard {
  summary: {
    totalBoardPackages: number;
    approvedBoardPackages: number;
    pendingApproval: number;
    upcomingReportingDeadlines: number;
    activeCriticalRisksHighlighted: number;
    openBoardCommitments: number;
    sourceFreshnessScore: number;
  };
  packages: ExecutiveReport[];
  pendingApproval: ExecutiveReportVersion[];
  nextDeadline: {
    title: string;
    dueDate: string;
    daysRemaining: number;
  };
}
