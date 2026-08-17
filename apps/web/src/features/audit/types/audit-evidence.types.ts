export type AuditEvidenceRow = Record<string, any> & {
  id: string;
  evidence_code?: string;
  evidence_title?: string;
  evidence_type?: string;
  evidence_status?: string;
  review_status?: string;
  readiness_status?: string;
  criticality?: string;
  confidentiality_level?: string;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  linked_module?: string | null;
  linked_record_id?: string | null;
  document_id?: string | null;
  storage_file_id?: string | null;
  updated_at?: string;
};

export type AuditEvidenceRegister = {
  rows: AuditEvidenceRow[];
  total: number;
  page: number;
  limit: number;
  summary?: AuditEvidenceSummary;
};

export type AuditEvidenceSummary = Record<string, number>;

export type AuditEvidenceDashboard = {
  summary: AuditEvidenceSummary;
  bySite: Record<string, any>[];
  byProgram: Record<string, any>[];
  byPlan: Record<string, any>[];
  byExecution: Record<string, any>[];
  byFinding: Record<string, any>[];
  byCapa: Record<string, any>[];
  bySourceModule: Record<string, any>[];
  byDocumentType: Record<string, any>[];
  missing: AuditEvidenceRow[];
  pendingReview: AuditEvidenceRow[];
  rejected: AuditEvidenceRow[];
  restricted: AuditEvidenceRow[];
  safetyCritical: AuditEvidenceRow[];
  requestsDueSoon: Record<string, any>[];
  requestsOverdue: Record<string, any>[];
  recent: AuditEvidenceRow[];
  recentUploads: AuditEvidenceRow[];
  recentAccess: Record<string, any>[];
  readiness: Record<string, number>;
};

export type AuditEvidenceDetail = {
  evidence: AuditEvidenceRow;
  links: Record<string, any>[];
  reviews: Record<string, any>[];
  custody: Record<string, any>[];
  access: Record<string, any>[];
  history: Record<string, any>[];
  calculated: Record<string, any>;
};

export type AuditEvidenceContext = {
  sites: Record<string, any>[];
  units: Record<string, any>[];
  areas: Record<string, any>[];
  users: Record<string, any>[];
  programs: Record<string, any>[];
  plans: Record<string, any>[];
  executions: Record<string, any>[];
  findings: Record<string, any>[];
  capas: Record<string, any>[];
  requirements: Record<string, any>[];
  settings: Record<string, any>;
  lookups: Record<string, string[] | Record<string, any>[]>;
};
