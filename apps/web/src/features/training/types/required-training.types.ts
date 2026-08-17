export type RequiredTrainingItem = {
  id: string;
  company_id: string;
  site_id?: string | null;
  training_code: string;
  training_title: string;
  training_category: string;
  training_type: string;
  description?: string | null;
  objective?: string | null;
  target_audience?: string | null;
  owner_user_id?: string | null;
  owner_role?: string | null;
  reviewer_user_id?: string | null;
  version: string;
  version_number?: number;
  effective_date?: string | null;
  next_review_date?: string | null;
  status: string;
  review_status: string;
  criticality?: string | null;
  safety_critical?: boolean;
  psm_critical?: boolean;
  ptw_critical?: boolean;
  moc_critical?: boolean;
  pssr_critical?: boolean;
  recurrence_type?: string | null;
  recurrence_interval_days?: number | null;
  delivery_method?: string | null;
  evidence_policy_status?: string | null;
  document_status?: string | null;
  matrix_sync_status?: string | null;
  competency_sync_status?: string | null;
  usage_count?: number;
  readiness_status?: string | null;
  readiness_blockers_json?: RequiredTrainingBlocker[];
  notes?: string | null;
  archived_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type RequiredTrainingBlocker = {
  code: string;
  severity: 'Info' | 'Warning' | 'Blocker' | string;
  message: string;
};

export type RequiredTrainingSummary = Record<string, number>;
export type RequiredTrainingLookupMap = Record<string, string[]>;

export type RequiredTrainingRegistryResponse = {
  rows: RequiredTrainingItem[];
  allRows?: RequiredTrainingItem[];
  page: number;
  limit: number;
  total: number;
  summary: RequiredTrainingSummary;
  savedViews?: string[];
  lastUpdated?: string;
};

export type RequiredTrainingDashboardResponse = {
  header: Record<string, any>;
  summary: RequiredTrainingSummary;
  byCategory: Array<{ label: string; count: number }>;
  byStatus: Array<{ label: string; count: number }>;
  safetyCriticalPreview: RequiredTrainingItem[];
  ptwCriticalPreview: RequiredTrainingItem[];
  psmCriticalPreview: RequiredTrainingItem[];
  reviewOverduePreview: RequiredTrainingItem[];
  pendingApprovalPreview: RequiredTrainingItem[];
  matrixUnlinkedPreview: RequiredTrainingItem[];
  documentGaps: RequiredTrainingItem[];
  recentlyUpdated: RequiredTrainingItem[];
  reapprovalRequired: RequiredTrainingItem[];
  registry: RequiredTrainingRegistryResponse;
  settings?: Record<string, any>;
};

export type RequiredTrainingDetailResponse = {
  item: RequiredTrainingItem;
  header: Record<string, any>;
  summary: RequiredTrainingSummary;
  content: Array<Record<string, any>>;
  deliveryRules: Record<string, any> | null;
  evidenceRules: Record<string, any> | null;
  applicability: Array<Record<string, any>>;
  links: Array<Record<string, any>>;
  documents: Array<Record<string, any>>;
  matrixLinks: Array<Record<string, any>>;
  competencyLinks: Array<Record<string, any>>;
  versionHistory: Array<Record<string, any>>;
  reviewRecords: Array<Record<string, any>>;
  history: Array<Record<string, any>>;
  readiness: { status: string; blockers: RequiredTrainingBlocker[] };
  settings: Record<string, any>;
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
};

export type RequiredTrainingContext = {
  sites: Array<Record<string, any>>;
  units: Array<Record<string, any>>;
  areas: Array<Record<string, any>>;
  users: Array<Record<string, any>>;
  documents: Array<Record<string, any>>;
  matrixRules: Array<Record<string, any>>;
  competencyProfiles: Array<Record<string, any>>;
  lookups: RequiredTrainingLookupMap;
  settings: Record<string, any>;
  allowedSiteIds: string[];
  selectedSiteId?: string | null;
};
