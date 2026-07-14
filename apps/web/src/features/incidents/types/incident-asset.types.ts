export type IncidentAssetChemicalTabData = {
  restricted?: boolean;
  header?: Record<string, any>;
  summaryCards?: any[];
  equipmentRegister?: any[];
  chemicalRegister?: any[];
  equipmentCondition?: Record<string, any>;
  maintenanceInspectionSnapshot?: Record<string, any>;
  safeguardIplSisPsvAlarm?: Record<string, any>;
  sdsHazardInformation?: Record<string, any>;
  lossOfContainmentRelease?: Record<string, any>;
  processConditions?: Record<string, any>;
  followupRequirements?: any[];
  review?: Record<string, any>;
  changeHistory?: any[];
  readiness?: Record<string, any>;
  actions?: any[];
  permissions?: Record<string, any>;
};
