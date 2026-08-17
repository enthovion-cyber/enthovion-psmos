export type TrainingCertificate = {
  id: string;
  company_id?: string;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  worker_id: string;
  certificate_title: string;
  certificate_code?: string | null;
  certificate_number?: string | null;
  certificate_category: string;
  issuer_provider?: string | null;
  external_provider?: boolean;
  issue_date?: string | null;
  effective_date?: string | null;
  expiry_date?: string | null;
  no_expiry?: boolean;
  renewal_required?: boolean;
  certificate_status: string;
  verification_status: string;
  evidence_status: string;
  runtime_status?: string;
  safety_critical?: boolean;
  psm_critical?: boolean;
  ptw_critical?: boolean;
  moc_critical?: boolean;
  pssr_critical?: boolean;
  training_item_id?: string | null;
  completion_record_id?: string | null;
  competency_requirement_id?: string | null;
  matrix_gap_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CertificateDashboardSummary = {
  totalCertificates: number;
  current: number;
  expiringSoon: number;
  expired: number;
  missingRequired: number;
  pendingVerification: number;
  rejected: number;
  revoked: number;
  safetyCritical: number;
  ptwCriticalGaps: number;
  mocBlockers: number;
  pssrBlockers: number;
  externalCertificates: number;
  withoutEvidence: number;
  renewalsDue: number;
  overdueRenewals: number;
  matrixGaps: number;
  competencyGaps: number;
};

export type CertificationDashboard = {
  summary: CertificateDashboardSummary;
  expiring: TrainingCertificate[];
  pendingVerification: TrainingCertificate[];
  safetyCriticalGaps: TrainingCertificate[];
  settings: Record<string, unknown>;
  lastUpdated: string;
};

export type CertificateRegister = {
  rows: TrainingCertificate[];
  total: number;
  page: number;
  limit: number;
  summary?: CertificateDashboardSummary;
  filters?: Record<string, string[]>;
};

export type CertificateDetail = {
  certificate: TrainingCertificate;
  documents: Array<Record<string, unknown>>;
  renewals: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  runtimeStatus: string;
};
