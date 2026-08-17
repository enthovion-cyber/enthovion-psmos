export type MaterialCompatibilityRow = Record<string, any> & {
  id: string;
  compatibility_record_number?: string | null;
  compatibility_title?: string | null;
  compatibility_status?: string | null;
  review_status?: string | null;
  unit_id?: string | null;
  area_id?: string | null;
  equipment_id?: string | null;
  chemical_id?: string | null;
  component_type?: string | null;
  compatibility_scope?: string | null;
  compatibility_rating?: string | null;
  rating_confidence?: string | null;
  completeness_status?: string | null;
  completeness_score?: number | null;
  conflict_status?: string | null;
  moc_update_required?: boolean | null;
  pssr_blocker?: boolean | null;
  mi_readiness_impact?: boolean | null;
  chemical_name?: string | null;
  cas_number?: string | null;
  material_family?: string | null;
  material_grade?: string | null;
  degradation_mechanism_summary?: string | null;
  evidence_status?: string | null;
};

export type MaterialCompatibilitySummary = Record<string, number | string | boolean | null>;

export type MaterialCompatibilityRegistry = {
  rows: MaterialCompatibilityRow[];
  summary: MaterialCompatibilitySummary;
  total: number;
  page: number;
  limit: number;
  lastUpdated: string;
  savedViews: Array<Record<string, any>>;
};

export type MaterialCompatibilityDetail = {
  compatibility: MaterialCompatibilityRow;
  serviceConditions?: Record<string, any> | null;
  materialDetails?: Record<string, any> | null;
  rating?: Record<string, any> | null;
  degradationMechanisms: Array<Record<string, any>>;
  controls?: Record<string, any> | null;
  documents: Array<Record<string, any>>;
  conflicts: Array<Record<string, any>>;
  completeness: Array<Record<string, any>>;
  history: Array<Record<string, any>>;
  linkedRecords: Array<Record<string, any>>;
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
};

export type MaterialCompatibilityLookups = {
  materialFamilies: string[];
  materialGrades: string[];
  componentTypes: string[];
  compatibilityScopes: string[];
  compatibilityRatings: string[];
  ratingConfidence: string[];
  compatibilityBasis: string[];
  degradationMechanisms: string[];
  exposureTypes: string[];
  compatibilityDocumentTypes: string[];
  materialConflictStatuses: string[];
};

