import { incidentDetailService } from './incident-detail.service';

export const incidentSeverityRiskService = {
  get: incidentDetailService.severityRisk,
  update: incidentDetailService.updateSeverityRisk
};
