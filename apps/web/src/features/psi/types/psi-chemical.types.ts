import type { ReactNode } from 'react';

export type PsiChemical = Record<string, any> & {
  id: string;
  chemical_name: string;
  cas_number?: string | null;
  formula?: string | null;
  unit_id: string;
  area_id?: string | null;
  process_use?: string | null;
  use_type?: string | null;
  max_intended_inventory?: number | string | null;
  normal_inventory?: number | string | null;
  inventory_unit?: string | null;
  physical_state?: string | null;
  chemical_category?: string | null;
  high_hazard?: boolean;
  sds_status?: string | null;
  compatibility_risk_level?: string | null;
  exposure_limit_status?: string | null;
  emergency_response_status?: string | null;
  review_status?: string | null;
  moc_update_required?: boolean;
};

export type PsiChemicalRegistry = {
  rows: PsiChemical[];
  page: number;
  limit: number;
  total: number;
  summary: PsiChemicalSummary;
  savedViews: string[];
  lastUpdated: string;
};

export type PsiChemicalSummary = {
  totalChemicals: number;
  currentSds: number;
  missingSds: number;
  expiredSds: number;
  highHazardChemicals: number;
  flammableChemicals: number;
  toxicChemicals: number;
  reactiveChemicals: number;
  corrosiveChemicals: number;
  carcinogenCmrFlagged: number;
  incompatibleStorageRisks: number;
  missingExposureLimits: number;
  missingEmergencyResponseInfo: number;
  mocUpdateRequired: number;
  lastUpdated: string;
};

export type PsiChemicalDetail = {
  chemical: PsiChemical;
  unit: Record<string, any>;
  sdsLinks: Record<string, any>[];
  hazards: Record<string, any> | null;
  exposureHealth: Record<string, any> | null;
  storageCompatibility: Record<string, any> | null;
  emergencyControls: Record<string, any> | null;
  compatibilityChecks: Record<string, any>[];
  history: Record<string, any>[];
  overview: { cards: Array<{ label: string; value: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' }>; sdsLinks: Record<string, any>[]; compatibilityWarnings: Record<string, any>[] };
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
  actions: Array<{ key: string; label: string; enabled: boolean; disabledReason?: string | null }>;
};

export type PsiChemicalLookups = {
  physicalStates: string[];
  chemicalCategories: string[];
  chemicalUseTypes: string[];
  ghsHazardClasses: string[];
  sdsStatuses: string[];
  storageClasses: string[];
  compatibilityRiskLevels: string[];
};
