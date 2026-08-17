import type { ReactNode } from 'react';

export type ProcessChemistry = Record<string, any> & {
  id: string;
  unit_id: string;
  site_id: string;
  chemistry_name: string;
  chemistry_type: string;
  operating_mode?: string | null;
  process_step?: string | null;
  status?: string | null;
  process_chemistry_summary?: string | null;
  main_reaction_equation?: string | null;
  reaction_phase?: string | null;
  hazard_level?: string | null;
  runaway_potential?: string | null;
  decomposition_potential?: string | null;
  polymerization_potential?: string | null;
  completeness_score?: number | null;
  completeness_status?: string | null;
  review_status?: string | null;
  moc_update_required?: boolean | null;
  pssr_blocker?: boolean | null;
};

export type ProcessChemistrySummary = {
  totalChemistryRecords: number;
  unitsWithChemistryDefined: number;
  unitsMissingChemistry: number;
  highHazardReactions: number;
  exothermicReactions: number;
  runawayPotential: number;
  decompositionHazards: number;
  polymerizationHazards: number;
  toxicGasPotential: number;
  overpressurePotential: number;
  incompatibleMixingRisks: number;
  missingReactionConditions: number;
  missingUnwantedScenarioData: number;
  mocUpdateRequired: number;
  pssrBlockers: number;
  lastUpdated: string;
};

export type ProcessChemistryRegistry = {
  rows: ProcessChemistry[];
  page: number;
  limit: number;
  total: number;
  summary: ProcessChemistrySummary;
  savedViews: string[];
  lastUpdated: string;
};

export type ProcessChemistryDetail = {
  chemistry: ProcessChemistry;
  unit: Record<string, any>;
  roles: Record<string, any>[];
  conditions: Record<string, any> | null;
  hazards: Record<string, any> | null;
  scenarios: Record<string, any>[];
  controls: Record<string, any>[];
  documents: Record<string, any>[];
  completeness: Record<string, any>[];
  history: Record<string, any>[];
  overview: {
    cards: Array<{ label: string; value: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'danger' }>;
    conditions?: Record<string, any> | null;
    hazards?: Record<string, any> | null;
    scenarios?: Record<string, any>[];
  };
  tabs: Array<{ label: string; href: string; enabled: boolean }>;
  actions: Array<{ key: string; label: string; enabled: boolean; disabledReason?: string | null }>;
};

export type ProcessChemistryLookups = {
  chemistryTypes: string[];
  reactionPhases: string[];
  operatingModes: string[];
  chemicalRoles: string[];
  reactionHazardLevels: string[];
  unwantedScenarioTypes: string[];
  chemistryControlTypes: string[];
};
