export type LopaInitiatingEventTabData = {
  study: any;
  summary: Record<string, any>;
  definition: Record<string, any>;
  librarySnapshot: any | null;
  manualFrequency: Record<string, any>;
  siteModifier: Record<string, any>;
  modifiers: any[];
  frequencySnapshot: Record<string, any>;
  readiness: { status: string; checklist: any[]; blockers: any[]; warnings: any[]; completionPercent: number };
  notes: any[];
  actions: any[];
};

export type LopaInitiatingEventContext = {
  initiatingEventCategories: string[];
  conditionalModifierTypes: string[];
  sourceTypes: string[];
  approvalStatuses: string[];
  readOnly: boolean;
};

export type LopaInitiatingEventUpdate = Record<string, string | number | boolean | null | undefined>;
