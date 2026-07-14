import { useQuery } from '@tanstack/react-query';
import { incidentOverviewSummaryService } from '../services/incident-overview-summary.service';

export function useIncidentOverviewSummary(incidentId?: string) {
  return useQuery({ queryKey: ['incidents', 'overview-summary', incidentId], queryFn: () => incidentOverviewSummaryService.get(incidentId as string), enabled: !!incidentId });
}
