export type IncidentEventDetailsData = {
  restricted?: boolean;
  header?: Record<string, any>;
  summaryCards?: any[];
  coreEventInformation?: Record<string, any>;
  locationTimeOperation?: Record<string, any>;
  eventDescription?: Record<string, any>;
  eventTypeClassification?: Record<string, any>;
  psmPseClassification?: Record<string, any>;
  ptwMocPssrContext?: Record<string, any>;
  environmentalCommunityImpact?: Record<string, any>;
  reporterWitnessSnapshot?: Record<string, any>;
  classificationReview?: Record<string, any>;
  classificationChangeHistory?: any[];
  readiness?: Record<string, any>;
  actions?: any[];
  permissions?: Record<string, any>;
};

export type IncidentEventDetailsForm = Record<string, any>;
