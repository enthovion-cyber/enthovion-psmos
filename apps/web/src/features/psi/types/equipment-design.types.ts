export type EquipmentDesignBasis = {
  id: string;
  unit_id: string;
  site_id: string;
  area_id?: string | null;
  equipment_id: string;
  equipment_tag: string;
  equipment_name: string;
  equipment_type: string;
  equipment_category?: string | null;
  system_service?: string | null;
  equipment_criticality: string;
  safety_critical: boolean;
  psm_critical: boolean;
  status: string;
  service_fluid?: string | null;
  fluid_phase?: string | null;
  completeness_status: string;
  completeness_score?: number | null;
  conflict_status: string;
  review_status: string;
  moc_update_required: boolean;
  pssr_blocker: boolean;
  mi_readiness_impact: boolean;
  next_review_due?: string | null;
  updated_at?: string | null;
  ratings?: EquipmentDesignRatings | null;
  serviceBasis?: Record<string, unknown> | null;
  material?: Record<string, unknown> | null;
  capacity?: Record<string, unknown> | null;
  codes?: Record<string, unknown> | null;
  documents?: Array<Record<string, unknown>>;
  conflicts?: Array<Record<string, unknown>>;
  missingDatasheet?: boolean;
  missingDesignPressureTemperature?: boolean;
};

export type EquipmentDesignRatings = Record<string, number | string | boolean | null | undefined> & {
  design_pressure?: number | null;
  design_pressure_unit?: string | null;
  mawp?: number | null;
  mawp_unit?: string | null;
  mop?: number | null;
  mop_unit?: string | null;
  min_design_temperature?: number | null;
  max_design_temperature?: number | null;
  temperature_unit?: string | null;
};

export type EquipmentDesignSummary = {
  totalEquipmentDesignBasisRecords: number;
  equipmentWithCompleteDesignBasis: number;
  equipmentMissingDesignBasis: number;
  safetyCriticalEquipmentMissingDesignBasis: number;
  criticalEquipmentWithConflicts: number;
  designBasisPendingApproval: number;
  reviewOverdue: number;
  mocRequired: number;
  missingDatasheets: number;
  missingDesignCode: number;
  missingMaterialOfConstruction: number;
  missingDesignPressureTemperature: number;
  solConflicts: number;
  reliefBasisConflicts: number;
  miReadinessImpact: number;
  pssrBlockers: number;
  lastUpdated: string;
};

export type EquipmentDesignRegistry = {
  rows: EquipmentDesignBasis[];
  page: number;
  limit: number;
  total: number;
  summary: EquipmentDesignSummary;
  savedViews: string[];
  lastUpdated: string;
};

export type EquipmentDesignDetail = {
  designBasis: EquipmentDesignBasis;
  unit?: Record<string, unknown>;
  ratings?: EquipmentDesignRatings | null;
  serviceBasis?: Record<string, unknown> | null;
  materialBasis?: Record<string, unknown> | null;
  capacityBasis?: Record<string, unknown> | null;
  codes?: Record<string, unknown> | null;
  assumptions?: Record<string, unknown> | null;
  documents: Array<Record<string, unknown>>;
  conflicts: Array<Record<string, unknown>>;
  completeness: Array<Record<string, unknown>>;
  syncEvents: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  overview: { cards: Array<{ label: string; value: unknown; tone?: 'neutral' | 'good' | 'warn' | 'danger' }> };
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
  actions: Array<{ key: string; label: string; enabled: boolean; disabledReason?: string | null }>;
};

export type EquipmentDesignLookups = {
  equipmentTypes: string[];
  equipmentCategories: string[];
  designCodes: string[];
  fluidPhases: string[];
  materials: string[];
  equipmentCriticalities: string[];
  conflictStatuses: string[];
  documentTypes: string[];
};
