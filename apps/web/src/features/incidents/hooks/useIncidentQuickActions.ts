import { useQuery } from '@tanstack/react-query';
import { incidentOverviewService } from '../services/incident-overview.service';

export function useIncidentQuickActions(incidentId?: string) {
  return useQuery({ queryKey: ['incidents', 'quick-actions', incidentId], queryFn: () => incidentOverviewService.quickActions(incidentId as string), enabled: !!incidentId });
}
