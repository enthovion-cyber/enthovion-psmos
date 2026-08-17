export type SafeguardRow = Record<string, any> & {
  id: string;
  safeguard_title: string;
  safeguard_tag?: string | null;
  site_id?: string | null;
  unit_id: string;
  area_id?: string | null;
  equipment_id?: string | null;
  system_service?: string | null;
  safeguard_category: string;
  safeguard_type: string;
  function_type: string;
  criticality: string;
  safety_critical?: boolean | null;
  psm_critical?: boolean | null;
  ipl_candidate?: boolean | null;
  status?: string | null;
  effectiveness_status?: string | null;
  source_status?: string | null;
  testing_status?: string | null;
  impairment_status?: string | null;
  completeness_status?: string | null;
  completeness_score?: number | null;
  conflict_status?: string | null;
  review_status?: string | null;
  moc_update_required?: boolean | null;
  pssr_blocker?: boolean | null;
  mi_readiness_impact?: boolean | null;
  evidence_status?: string | null;
  hazardLinks?: Array<Record<string, any>>;
  sourceLinks?: Array<Record<string, any>>;
  documents?: Array<Record<string, any>>;
  effectiveness?: Record<string, any> | null;
  testing?: Record<string, any> | null;
};

export type SafeguardSummary = Record<string, number | string | boolean | null>;

export type SafeguardRegistry = {
  rows: SafeguardRow[];
  summary: SafeguardSummary;
  total: number;
  page: number;
  limit: number;
  savedViews: string[];
  lastUpdated: string;
};

export type SafeguardDetail = {
  safeguard: SafeguardRow;
  unit?: Record<string, any> | null;
  hazardLinks: Array<Record<string, any>>;
  functionRequirements?: Record<string, any> | null;
  sourceLinks: Array<Record<string, any>>;
  effectiveness?: Record<string, any> | null;
  testingStatus?: Record<string, any> | null;
  documents: Array<Record<string, any>>;
  completeness: Array<Record<string, any>>;
  conflicts: Array<Record<string, any>>;
  history: Array<Record<string, any>>;
  syncEvents: Array<Record<string, any>>;
  overview: { cards: Array<Record<string, any>>; blockers: Array<Record<string, any>> };
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
  actions: Array<{ key: string; label: string; enabled: boolean; disabledReason?: string | null }>;
};

export type SafeguardLookups = {
  categories: string[];
  types: string[];
  functionTypes: string[];
  criticalities: string[];
  sourceModules: string[];
  effectivenessStatuses: string[];
  iplQualificationStatuses: string[];
  testingStatuses: string[];
  conflictStatuses: string[];
  documentTypes: string[];
};
