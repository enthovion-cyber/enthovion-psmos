export type IncidentRcaData = {
  header?: Record<string, any>;
  summaryCards?: any[];
  prerequisites?: any;
  method?: Record<string, any>;
  causalFactorsRegister?: any[];
  fiveWhy?: any;
  fishbone?: any;
  causeTree?: any;
  causeClassification?: any;
  evidenceMappedCauses?: any[];
  unsupportedAssumptions?: any;
  rootCauseRegister?: any[];
  systemicWeaknesses?: any[];
  qualityCheck?: any;
  capaPreview?: any;
  review?: any;
  changeHistory?: any[];
  readiness?: any;
  charts?: Record<string, any[]>;
  actions?: any[];
  permissions?: Record<string, any>;
  restricted?: boolean;
  generatedAt?: string;
};

export type RcaMutationPayload = Record<string, any>;
