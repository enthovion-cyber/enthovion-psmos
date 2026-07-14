export type IncidentCreateValues = Record<string, any>;

export type IncidentCreateContext = {
  sites: any[];
  units: any[];
  areas: any[];
  users: any[];
  equipment: any[];
  currentUser?: any;
  riskMatrix?: any;
  classificationConfig?: any;
  pseThresholdConfig?: any;
  drafts?: any[];
  eventTypes: string[];
  classifications: string[];
  severities: string[];
  pseTiers: string[];
  priorities: string[];
  permissions?: Record<string, boolean>;
};

export type IncidentWizardStep = {
  id: number;
  title: string;
  description: string;
};

export type IncidentSubmitResult = {
  incidentId: string;
  incidentNumber: string;
  redirectTo: string;
  incident: any;
  risk?: any;
  classification?: any;
  followups?: any;
};
