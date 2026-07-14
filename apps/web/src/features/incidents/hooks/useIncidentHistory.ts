import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentHistoryService } from '../services/incident-history.service';
import type { IncidentHistoryData } from '../types/incident-history.types';

export function useIncidentHistory(id: string, filters: Record<string, any> = {}) {
  return useQuery<IncidentHistoryData>({ queryKey: ['incidents', 'history', id, filters], queryFn: () => incidentHistoryService.tab(id, filters), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentHistoryMutations(id: string, filters: Record<string, any> = {}) {
  const queryClient = useQueryClient();
  return {
    exportHistory: useMutation({ mutationFn: () => incidentHistoryService.export(id, filters), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents', 'history', id] }) })
  };
}
