import { useQuery } from '@tanstack/react-query';
import { incidentOverviewReadinessService } from '../services/incident-overview-readiness.service';

export function useIncidentOverviewReadiness(incidentId?: string) {
  return useQuery({ queryKey: ['incidents', 'overview-readiness', incidentId], queryFn: () => incidentOverviewReadinessService.get(incidentId as string), enabled: !!incidentId });
}
