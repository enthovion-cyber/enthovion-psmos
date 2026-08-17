export type AuditReportRow = {
  id: string;
  report_code: string;
  report_title: string;
  report_type: string;
  report_status: string;
  readiness_status?: string | null;
  stale_status?: string | null;
  source_module?: string | null;
  source_record_number?: string | null;
  source_record_title?: string | null;
  intended_audience?: string | null;
  confidentiality_level?: string | null;
  restricted?: boolean | null;
  locked?: boolean | null;
  official_report?: boolean | null;
  generated_at?: string | null;
  archived_at?: string | null;
};

export type AuditReportSummary = {
  total: number;
  draft: number;
  generated: number;
  pendingApproval: number;
  approved: number;
  locked: number;
  stale: number;
  failed: number;
  exported: number;
  archived: number;
  downloadsTracked: number;
  restricted: number;
};

export type AuditReportList = {
  rows: AuditReportRow[];
  total: number;
  page: number;
  limit: number;
  summary?: AuditReportSummary;
};

export type AuditReportDashboard = {
  summary: AuditReportSummary;
  bySite: Array<{ key: string; label: string; count: number }>;
  byType: Array<{ key: string; label: string; count: number }>;
  byStatus: Array<{ key: string; label: string; count: number }>;
  staleReports: AuditReportRow[];
  failedJobs: Record<string, unknown>[];
  recentReports: AuditReportRow[];
  downloadActivity: Record<string, unknown>[];
  templates: Record<string, unknown>[];
  packages: Record<string, unknown>[];
};

export type AuditReportDetail = {
  report: AuditReportRow & Record<string, unknown>;
  source: Record<string, unknown>[];
  snapshot: Record<string, unknown>;
  sections: Record<string, unknown>[];
  evidence: Record<string, unknown>[];
  findings: Record<string, unknown>;
  capa: Record<string, unknown>;
  scoring: Record<string, unknown>;
  standards: Record<string, unknown>;
  approval: Record<string, unknown>[];
  files: Record<string, unknown>[];
  versions: Record<string, unknown>[];
  access: Record<string, unknown>[];
  downloads: Record<string, unknown>[];
  staleness: Record<string, unknown>[];
  validation: Record<string, unknown>[];
  history: Record<string, unknown>[];
  readiness: { status: string; blockers: Array<{ title: string; message: string; severity: string }>; readyForExport: boolean; readyForApproval: boolean; locked: boolean; stale: boolean };
  preview: Record<string, unknown>;
};
