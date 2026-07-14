export type IncidentSeverityRiskData = {
  restricted?: boolean;
  header?: Record<string, any>;
  summaryCards?: any[];
  comparison?: Record<string, any>;
  actualConsequence?: Record<string, any>;
  potentialConsequence?: Record<string, any>;
  likelihood?: Record<string, any>;
  riskMatrix?: Record<string, any>;
  investigationPriorityDecision?: Record<string, any>;
  investigationLevelRules?: Record<string, any>;
  highPotentialNearMiss?: Record<string, any>;
  severityReview?: Record<string, any>;
  riskMatrixConfiguration?: Record<string, any>;
  severityChangeHistory?: any[];
  readiness?: Record<string, any>;
  actions?: any[];
};

export type IncidentSeverityRiskForm = Record<string, any>;
