import { useQuery } from '@tanstack/react-query';
import { incidentOverviewService } from '../services/incident-overview.service';

export function useIncidentOverview(incidentId?: string, initialData?: any) {
  return useQuery({
    queryKey: ['incidents', 'overview', incidentId],
    queryFn: () => incidentOverviewService.get(incidentId as string),
    enabled: !!incidentId && !initialData,
    initialData,
    refetchInterval: 30000,
    refetchOnWindowFocus: false
  });
}
