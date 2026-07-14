export type IncidentBarrierData = Record<string, any> & {
  header?: Record<string, any>;
  summaryCards?: any[];
  barrierRegister?: any[];
  readiness?: Record<string, any>;
  permissions?: Record<string, boolean>;
  restricted?: boolean;
};
