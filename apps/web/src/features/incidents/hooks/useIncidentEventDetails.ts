import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentDetailService } from '../services/incident-detail.service';

export function useIncidentEventDetails(id: string) {
  return useQuery({
    queryKey: ['incidents', 'event-details', id],
    queryFn: () => incidentDetailService.eventDetails(id),
    enabled: !!id,
    refetchOnWindowFocus: false
  });
}

export function useIncidentEventDetailsMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'event-details', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    save: useMutation({ mutationFn: (values: any) => incidentDetailService.updateEventDetails(id, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentDetailService.requestClassificationReview(id, values), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (values: any) => incidentDetailService.approveClassification(id, values), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (values: any) => incidentDetailService.rejectClassification(id, values), onSuccess: invalidate })
  };
}
