import { useQuery } from '@tanstack/react-query';
import { incidentOverviewReadinessService } from '../services/incident-overview-readiness.service';

export function useIncidentBlockers(incidentId?: string) {
  return useQuery({ queryKey: ['incidents', 'blockers', incidentId], queryFn: () => incidentOverviewReadinessService.blockers(incidentId as string), enabled: !!incidentId });
}
