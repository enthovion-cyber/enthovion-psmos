import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentTimelineService } from '../services/incident-timeline.service';

export function useIncidentTimeline(id: string) {
  return useQuery({ queryKey: ['incidents', 'timeline', id], queryFn: () => incidentTimelineService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentTimelineMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'timeline', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    create: useMutation({ mutationFn: (values: any) => incidentTimelineService.createEvent(id, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ eventId, values }: any) => incidentTimelineService.updateEvent(id, eventId, values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (eventId: string) => incidentTimelineService.deleteEvent(id, eventId), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentTimelineService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentTimelineService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentTimelineService.rejectReview(id, values), onSuccess: invalidate })
  };
}
