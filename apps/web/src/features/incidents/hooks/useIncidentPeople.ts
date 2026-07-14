import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentPeopleService } from '../services/incident-people.service';

export function useIncidentPeople(id: string) {
  return useQuery({
    queryKey: ['incidents', 'people-injury', id],
    queryFn: () => incidentPeopleService.tab(id),
    enabled: !!id,
    refetchOnWindowFocus: false
  });
}

export function useIncidentPeopleMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'people-injury', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    create: useMutation({ mutationFn: (values: any) => incidentPeopleService.create(id, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ personId, values }: any) => incidentPeopleService.update(id, personId, values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (personId: string) => incidentPeopleService.remove(id, personId), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentPeopleService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentPeopleService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentPeopleService.rejectReview(id, values), onSuccess: invalidate })
  };
}
