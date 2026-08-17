export type PsiPaged<T> = { rows: T[]; page: number; limit: number; total: number };

export type PsiReportTemplate = {
  id: string;
  template_number?: string | null;
  template_name: string;
  template_type: string;
  report_category: string;
  scope_type: string;
  description?: string | null;
  module_keys?: string[];
  include_documents?: boolean;
  default_format?: string;
  active?: boolean;
  updated_at?: string;
};

export type PsiGeneratedReport = {
  id: string;
  report_number: string;
  report_name: string;
  report_type: string;
  report_category: string;
  scope_type: string;
  status: string;
  format: string;
  generated_with_warnings?: boolean;
  warnings_json?: Record<string, unknown>[];
  blockers_json?: Record<string, unknown>[];
  generated_at?: string;
  generated_by?: string | null;
  file_count?: number;
  document_inclusion_status?: string;
};

export type PsiReportFile = {
  id: string;
  file_name: string;
  file_type: string;
  file_format: string;
  classification?: string;
  redacted?: boolean;
  download_count?: number;
  created_at?: string;
};

export type PsiExportJob = {
  id: string;
  export_number: string;
  export_name: string;
  export_type: string;
  package_type?: string | null;
  scope_type: string;
  output_format: string;
  status: string;
  progress_percent?: number;
  include_documents?: boolean;
  warnings_json?: Record<string, unknown>[];
  requested_at?: string;
};

export type PsiExportPackage = {
  id: string;
  package_number: string;
  package_name: string;
  package_type: string;
  scope_type: string;
  status: string;
  file_count?: number;
  document_count?: number;
  warning_count?: number;
  generated_at?: string;
  manifest_json?: Record<string, unknown>;
};

export type PsiExportPackageItem = {
  id: string;
  item_type: string;
  source_module?: string | null;
  source_record_number?: string | null;
  title: string;
  included?: boolean;
  redacted?: boolean;
  excluded_reason?: string | null;
};

export type PsiScheduledReport = {
  id: string;
  schedule_name: string;
  report_type: string;
  frequency: string;
  output_format: string;
  enabled?: boolean;
  status: string;
  next_run_at?: string | null;
  last_run_at?: string | null;
  failure_count?: number;
};

export type PsiReportHistoryEvent = {
  id: string;
  event_type: string;
  event_title: string;
  event_description?: string | null;
  related_record_type: string;
  related_record_id?: string | null;
  actor_user_id?: string | null;
  created_at?: string;
};

export type PsiReportSummary = {
  generatedReports: number;
  scheduledReports: number;
  exportPackages: number;
  reportsGeneratedThisMonth: number;
  failedReportJobs: number;
  pendingReportJobs: number;
  auditPackagesGenerated: number;
  pssrPackagesGenerated: number;
  mocPackagesGenerated: number;
  hazopPsiPackagesGenerated: number;
  unitPsiReports: number;
  equipmentPsiReports: number;
  downloadsThisMonth: number;
  largeExportsInProgress: number;
  reportsRequiringRegeneration: number;
  scheduledReportsDueSoon: number;
};

export type PsiReportsDashboard = {
  header: { title: string; subtitle: string; activeSiteId?: string | null; lastUpdated?: string; canGenerate?: boolean; canExport?: boolean; canSchedule?: boolean };
  summary: PsiReportSummary;
  generated: PsiPaged<PsiGeneratedReport>;
  exportJobs: PsiPaged<PsiExportJob>;
  exportPackages: PsiPaged<PsiExportPackage>;
  scheduledReports: PsiPaged<PsiScheduledReport>;
  templates: PsiPaged<PsiReportTemplate>;
  history: PsiReportHistoryEvent[];
  attention: { label: string; value: number; tone?: string }[];
};

export type PsiReportDetail = { report: PsiGeneratedReport; files: PsiReportFile[]; history: PsiReportHistoryEvent[] };
export type PsiPackageDetail = { package: PsiExportPackage; items: PsiExportPackageItem[]; files: PsiReportFile[]; history: PsiReportHistoryEvent[] };
export type PsiExportJobDetail = { job: PsiExportJob; package?: PsiPackageDetail | null; files: PsiReportFile[] };
export type PsiReportSettings = Record<string, unknown>;
