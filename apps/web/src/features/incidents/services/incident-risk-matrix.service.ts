import { incidentDetailService } from './incident-detail.service';

export const incidentRiskMatrixService = {
  get: incidentDetailService.severityRisk,
  recalculate: incidentDetailService.recalculateSeverityRisk
};
