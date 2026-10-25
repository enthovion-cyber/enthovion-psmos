export type RegulatoryReport = Record<string, unknown> & {
  id: string;
  report_title: string;
  report_type: string;
  report_status: string;
  readiness_status: string;
  export_format: string;
  stale_status?: string;
};

export type RegulatoryReportRegister = {
  rows: RegulatoryReport[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  summary: Record<string, number>;
  permissions?: Record<string, unknown>;
};

export type RegulatoryReportDetail = Record<string, unknown> & {
  report: RegulatoryReport;
  overview: Record<string, unknown>;
  source: { rows: Record<string, unknown>[]; snapshot?: unknown };
  sections: { rows: Record<string, unknown>[]; config?: unknown };
  evidence: { rows: Record<string, unknown>[]; rules?: unknown };
  files: { rows: Record<string, unknown>[] };
  versions: { rows: Record<string, unknown>[] };
  jobs: { rows: Record<string, unknown>[] };
  history: { rows: Record<string, unknown>[] };
  permissions?: Record<string, unknown>;
  readOnly?: boolean;
  readOnlyReason?: string | null;
};

export type RegulatoryReportDashboard = Record<string, unknown> & {
  summary: Record<string, number>;
  staleReportsPreview?: RegulatoryReport[];
  pendingApprovalPreview?: RegulatoryReport[];
  failedJobsPreview?: Record<string, unknown>[];
  permissions?: Record<string, unknown>;
};
