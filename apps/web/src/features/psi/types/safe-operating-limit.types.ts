export type SafeOperatingLimit = {
  id: string;
  unit_id: string;
  site_id: string;
  area_id?: string | null;
  equipment_id?: string | null;
  limit_title: string;
  system_service?: string | null;
  parameter_name: string;
  parameter_tag?: string | null;
  parameter_type: string;
  limit_scope: string;
  criticality: string;
  safety_critical: boolean;
  psm_critical: boolean;
  operating_mode?: string | null;
  status: string;
  unit_of_measure: string;
  related_process_chemistry_id?: string | null;
  related_chemical_id?: string | null;
  related_equipment_design_basis_id?: string | null;
  related_relief_system_id?: string | null;
  related_procedure_document_id?: string | null;
  related_drawing_document_id?: string | null;
  completeness_status: string;
  completeness_score?: number | null;
  conflict_status: string;
  review_status: string;
  moc_update_required: boolean;
  pssr_blocker: boolean;
  next_review_due?: string | null;
  updated_at?: string | null;
  values?: SafeOperatingLimitValues | null;
  missingConsequence?: boolean;
  missingOperatorResponse?: boolean;
  missingSafeguard?: boolean;
  linkedHazopCount?: number;
  linkedControlCount?: number;
};

export type SafeOperatingLimitValues = Record<string, number | string | null | undefined> & {
  normal_min?: number | null;
  normal_max?: number | null;
  normal_target?: number | null;
  low_alarm?: number | null;
  high_alarm?: number | null;
  low_trip?: number | null;
  high_trip?: number | null;
  sif_interlock_setpoint?: number | null;
  min_design_limit?: number | null;
  max_design_limit?: number | null;
  min_safe_limit?: number | null;
  max_safe_limit?: number | null;
  unit_of_measure?: string;
};

export type SafeOperatingLimitSummary = {
  totalSafeOperatingLimits: number;
  criticalLimits: number;
  safetyCriticalLimits: number;
  unitLevelLimits: number;
  equipmentLevelLimits: number;
  missingCriticalLimits: number;
  limitsWithMissingConsequences: number;
  limitsWithMissingOperatorResponse: number;
  limitsWithMissingSafeguards: number;
  limitsWithConflicts: number;
  limitsPendingApproval: number;
  limitsReviewOverdue: number;
  limitsRequiringMoc: number;
  limitsLinkedToHazop: number;
  limitsLinkedToSisInterlockAlarm: number;
  limitsLinkedToMiEquipment: number;
  pssrBlockers: number;
  lastUpdated: string;
};

export type SafeOperatingLimitRegistry = {
  rows: SafeOperatingLimit[];
  page: number;
  limit: number;
  total: number;
  summary: SafeOperatingLimitSummary;
  savedViews: string[];
  lastUpdated: string;
};

export type SafeOperatingLimitDetail = {
  limit: SafeOperatingLimit;
  unit?: Record<string, unknown>;
  values?: SafeOperatingLimitValues | null;
  consequences: Array<Record<string, unknown>>;
  operatorResponses: Array<Record<string, unknown>>;
  controls: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  conflicts: Array<Record<string, unknown>>;
  completeness: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  overview: { cards: Array<{ label: string; value: unknown; tone?: 'neutral' | 'good' | 'warn' | 'danger' }> };
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
  actions: Array<{ key: string; label: string; enabled: boolean; disabledReason?: string | null }>;
};

export type SafeOperatingLimitLookups = {
  parameterTypes: string[];
  limitScopes: string[];
  operatingModes: string[];
  limitCriticalities: string[];
  deviationDirections: string[];
  consequenceSeverities: string[];
  solControlTypes: string[];
  conflictStatuses: string[];
};
