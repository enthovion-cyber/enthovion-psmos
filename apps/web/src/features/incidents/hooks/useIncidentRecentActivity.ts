import { useQuery } from '@tanstack/react-query';
import { incidentOverviewService } from '../services/incident-overview.service';

export function useIncidentRecentActivity(incidentId?: string) {
  return useQuery({ queryKey: ['incidents', 'recent-activity', incidentId], queryFn: () => incidentOverviewService.section(incidentId as string, 'activity'), enabled: !!incidentId });
}
