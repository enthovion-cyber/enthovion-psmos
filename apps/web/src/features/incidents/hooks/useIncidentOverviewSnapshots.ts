import { useQuery } from '@tanstack/react-query';
import { incidentOverviewSnapshotsService } from '../services/incident-overview-snapshots.service';

export function useIncidentOverviewSnapshots(incidentId?: string) {
  return useQuery({
    queryKey: ['incidents', 'overview-snapshots', incidentId],
    queryFn: async () => ({
      event: await incidentOverviewSnapshotsService.event(incidentId as string),
      severityRisk: await incidentOverviewSnapshotsService.severityRisk(incidentId as string),
      psmClassification: await incidentOverviewSnapshotsService.psmClassification(incidentId as string)
    }),
    enabled: !!incidentId
  });
}
