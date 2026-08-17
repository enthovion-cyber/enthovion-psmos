export type AuditRow = Record<string, any>;

export type AuditStandard = AuditRow & {
  id: string;
  standard_code: string;
  standard_name: string;
  standard_type: string;
  standard_status: string;
  site_id?: string | null;
};

export type AuditClause = AuditRow & {
  id: string;
  standard_id: string;
  clause_code: string;
  clause_title: string;
  criticality?: string | null;
  mandatory?: boolean;
};

export type AuditStandardMapping = AuditRow & {
  id: string;
  mapping_code: string;
  mapping_title: string;
  mapping_status: string;
  coverage_status: string;
  evidence_mapping_status: string;
  finding_mapping_status: string;
  capa_mapping_status: string;
  score_mapping_status: string;
  mapping_health_status: string;
  stale_status: string;
  ready_for_report?: boolean;
};

export type AuditMappingRegister = {
  rows: AuditStandardMapping[];
  total: number;
  page: number;
  limit: number;
  summary?: AuditRow;
};

export type AuditStandardMappingDashboard = {
  summary: AuditRow;
  byStandard: AuditRow[];
  bySite: AuditRow[];
  byModule: AuditRow[];
  gaps: AuditRow[];
  stale: AuditStandardMapping[];
  recent: AuditStandardMapping[];
  pendingReview: AuditStandardMapping[];
  verified: AuditStandardMapping[];
  archived: AuditStandardMapping[];
};

export type AuditStandardMappingDetail = {
  mapping: AuditStandardMapping;
  standard?: AuditStandard | null;
  clause?: AuditClause | null;
  links: AuditRow[];
  gaps: AuditRow[];
  overrides: AuditRow[];
  traceabilitySnapshots: AuditRow[];
  latestTraceability: AuditRow;
  staleness: AuditRow[];
  history: AuditRow[];
  coverage: AuditRow;
  readiness: AuditRow;
};

export type AuditStandardMappingContext = {
  sites: AuditRow[];
  units: AuditRow[];
  areas: AuditRow[];
  users: AuditRow[];
  programs: AuditRow[];
  plans: AuditRow[];
  executions: AuditRow[];
  standards: AuditStandard[];
  settings: AuditRow;
  lookups: AuditRow;
};
