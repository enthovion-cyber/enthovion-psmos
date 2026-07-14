import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentDetailService } from '../services/incident-detail.service';

export function useIncidentPotentialSeverity(id: string) {
  return useQuery({
    queryKey: ['incidents', 'severity-risk', id],
    queryFn: () => incidentDetailService.severityRisk(id),
    enabled: !!id,
    refetchOnWindowFocus: false
  });
}

export function useIncidentPotentialSeverityMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'severity-risk', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    save: useMutation({ mutationFn: (values: any) => incidentDetailService.updateSeverityRisk(id, values), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: () => incidentDetailService.recalculateSeverityRisk(id), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentDetailService.requestSeverityReview(id, values), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (values: any) => incidentDetailService.approveSeverityReview(id, values), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (values: any) => incidentDetailService.rejectSeverityReview(id, values), onSuccess: invalidate })
  };
}
