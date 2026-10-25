export type RegulatoryReviewPackage = {
  id: string;
  package_code?: string | null;
  package_title?: string | null;
  package_description?: string | null;
  source_type?: string | null;
  source_record_id?: string | null;
  source_record_number?: string | null;
  site_id?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  review_status?: string | null;
  validation_status?: string | null;
  current_stage_id?: string | null;
  current_reviewer_user_id?: string | null;
  decision?: string | null;
  criticality?: string | null;
  e_signature_required?: boolean | null;
  e_signature_status?: string | null;
  stale_status?: string | null;
  stale_reason?: string | null;
  source_locked?: boolean | null;
  submitted_by?: string | null;
  submitted_at?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  source_snapshot_json?: Record<string, unknown> | null;
};

export type RegulatoryReviewSummary = {
  totalReviewPackages?: number;
  pendingMyReview?: number;
  mySubmissions?: number;
  pendingReview?: number;
  inReview?: number;
  overdueReviews?: number;
  returnedForCorrection?: number;
  rejected?: number;
  approved?: number;
  approvedWithConditions?: number;
  completed?: number;
  escalated?: number;
  stalePackages?: number;
  validationFailures?: number;
  eSignaturesPending?: number;
  eSignaturesCompleted?: number;
  conditionsOpen?: number;
  conditionsOverdue?: number;
  criticalReviewsPending?: number;
};

export type RegulatoryReviewRegister = {
  rows: RegulatoryReviewPackage[];
  allRows?: RegulatoryReviewPackage[];
  total?: number;
  filters?: Record<string, unknown>;
  permissions?: RegulatoryReviewPermissions;
};

export type RegulatoryReviewDashboard = {
  header?: { title?: string; subtitle?: string; generatedAt?: string };
  summary?: RegulatoryReviewSummary;
  bySourceType?: Record<string, number>;
  bySite?: Record<string, number>;
  byReviewer?: Record<string, number>;
  byStatus?: Record<string, number>;
  byStaleStatus?: Record<string, number>;
  inboxPreview?: RegulatoryReviewPackage[];
  submissionPreview?: RegulatoryReviewPackage[];
  overduePreview?: RegulatoryReviewPackage[];
  stalePreview?: RegulatoryReviewPackage[];
  validationFailures?: RegulatoryReviewPackage[];
  recent?: RegulatoryReviewPackage[];
  permissions?: RegulatoryReviewPermissions;
};

export type RegulatoryReviewPermissions = {
  canView?: boolean;
  canCreate?: boolean;
  canSubmit?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canReturn?: boolean;
  canRequestInfo?: boolean;
  canESign?: boolean;
  canManageRules?: boolean;
  canEditSettings?: boolean;
};

export type RegulatoryReviewPackageDetail = {
  package: RegulatoryReviewPackage;
  overview?: Record<string, unknown>;
  source?: Record<string, unknown>;
  snapshot?: Record<string, unknown>;
  validation?: Array<Record<string, unknown>>;
  stages?: Array<Record<string, unknown>>;
  decisions?: Array<Record<string, unknown>>;
  conditions?: Array<Record<string, unknown>>;
  eSignatures?: Array<Record<string, unknown>>;
  history?: Array<Record<string, unknown>>;
  permissions?: RegulatoryReviewPermissions;
};
