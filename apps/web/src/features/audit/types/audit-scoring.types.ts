export type AuditScoreRow = Record<string, any> & {
  id: string;
  score_code?: string;
  score_title?: string;
  source_object_type?: string;
  source_object_id?: string;
  score_status?: string;
  readiness_status?: string;
  stale_status?: string;
  final_score?: number | null;
  original_calculated_score?: number | null;
  adjusted_score?: number | null;
  score_grade?: string | null;
  site_id?: string | null;
  program_id?: string | null;
  plan_id?: string | null;
  execution_id?: string | null;
  critical_blockers_json?: unknown;
  calculated_at?: string | null;
  updated_at?: string | null;
};

export type AuditScoreRegister = {
  rows: AuditScoreRow[];
  total: number;
  page: number;
  limit: number;
  summary?: Record<string, number | null>;
};

export type AuditScoringDashboard = {
  summary: Record<string, number | null>;
  bySite: Record<string, any>[];
  byModule: Record<string, any>[];
  byStandard: Record<string, any>[];
  stale: AuditScoreRow[];
  criticalBlockers: AuditScoreRow[];
  recent: AuditScoreRow[];
  pendingVerification: AuditScoreRow[];
  adjusted: AuditScoreRow[];
  locked: AuditScoreRow[];
  lowest: AuditScoreRow[];
  highest: AuditScoreRow[];
  trend: Record<string, any>[];
};

export type AuditScoreRunDetail = {
  scoreRun: AuditScoreRow;
  components: Record<string, any>[];
  ruleResults: Record<string, any>[];
  inputs: Record<string, any>[];
  adjustments: Record<string, any>[];
  verifications: Record<string, any>[];
  staleness: Record<string, any>[];
  snapshots: Record<string, any>[];
  history: Record<string, any>[];
  readiness: Record<string, any>;
  explainability: Record<string, any>;
  traceability: Record<string, any>;
};

export type AuditScoringModel = Record<string, any> & {
  id: string;
  model_code?: string;
  model_title?: string;
  model_type?: string;
  methodology_version?: string;
  model_status?: string;
  default_model?: boolean;
};

export type AuditScoringContext = {
  sites: Record<string, any>[];
  units: Record<string, any>[];
  areas: Record<string, any>[];
  users: Record<string, any>[];
  programs: Record<string, any>[];
  plans: Record<string, any>[];
  executions: Record<string, any>[];
  models: AuditScoringModel[];
  settings: Record<string, any>;
  lookups: Record<string, string[] | Record<string, any>[]>;
};
