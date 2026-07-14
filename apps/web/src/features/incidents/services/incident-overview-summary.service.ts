import { incidentOverviewService } from './incident-overview.service';

export const incidentOverviewSummaryService = {
  get: (incidentId: string) => incidentOverviewService.section(incidentId, 'summary')
};
