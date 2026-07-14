export type LopaReadinessCheck = {
  key: string;
  label: string;
  status: string;
  complete: boolean;
};

export type LopaScenarioConsequence = {
  study: any;
  summary: Record<string, any>;
  linkedHazop: Record<string, any> | null;
  scenario: Record<string, any>;
  causeConsequence: Record<string, any>;
  consequence: Record<string, any>;
  receptors: any[];
  riskCriteria: Record<string, any> | null;
  comparison: { changedCount: number; sourceChanged?: boolean; rows: any[]; snapshot?: any };
  readiness: { status: string; checklist: LopaReadinessCheck[]; blockers: any[]; warnings: any[]; completionPercent: number };
  notes: any[];
  actions: any[];
};

export type LopaScenarioContext = {
  operatingModes: string[];
  scenarioSources: string[];
  causeCategories: string[];
  causeTypes: string[];
  consequenceCategories: string[];
  impactTypes: string[];
  receptorTypes: string[];
  exposureRoutes: string[];
  riskCriteriaSources: string[];
  riskCriteriaTypes: string[];
  readOnly: boolean;
};

export type LopaScenarioUpdate = Record<string, string | number | boolean | null | undefined>;
