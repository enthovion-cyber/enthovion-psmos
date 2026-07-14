export type IncidentPersonRecord = Record<string, any>;
export type IncidentPeopleTabData = {
  restricted?: boolean;
  header?: Record<string, any>;
  summaryCards?: any[];
  peopleRegister?: IncidentPersonRecord[];
  injuryDetails?: Record<string, any>;
  exposureDetails?: Record<string, any>;
  ppeControls?: Record<string, any>;
  treatmentMedicalOutcome?: Record<string, any>;
  lostTimeRestrictedWork?: Record<string, any>;
  contractorVisitorPublic?: Record<string, any>;
  confidentialMedicalNotes?: Record<string, any>;
  review?: Record<string, any>;
  changeHistory?: any[];
  readiness?: Record<string, any>;
  actions?: any[];
  permissions?: Record<string, any>;
};
