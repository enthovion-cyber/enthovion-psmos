import { useQuery } from '@tanstack/react-query';
import { incidentHistoryService } from '../services/incident-history.service';
import type { IncidentHistoryDiff } from '../types/incident-history-diff.types';
export function useIncidentHistoryDiff(id: string, eventId?: string) {
  return useQuery<IncidentHistoryDiff>({ queryKey: ['incidents', 'history-diff', id, eventId], queryFn: () => incidentHistoryService.diff(id, eventId as string), enabled: !!id && !!eventId });
}
