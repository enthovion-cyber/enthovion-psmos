import type { IncidentReadiness } from '../types/incident-readiness.types';
import { incidentOverviewService } from './incident-overview.service';

export const incidentOverviewReadinessService = {
  get: (incidentId: string) => incidentOverviewService.section<IncidentReadiness>(incidentId, 'readiness'),
  blockers: (incidentId: string) => incidentOverviewService.section(incidentId, 'blockers')
};
