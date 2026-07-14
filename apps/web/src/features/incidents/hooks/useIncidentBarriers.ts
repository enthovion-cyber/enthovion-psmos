import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentBarriersService } from '../services/incident-barriers.service';
import type { IncidentBarrierData } from '../types/incident-barrier.types';

export function useIncidentBarriers(id: string) {
  return useQuery<IncidentBarrierData>({ queryKey: ['incidents', 'barriers', id], queryFn: () => incidentBarriersService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentBarrierMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'barriers', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    create: useMutation({ mutationFn: (values: any) => incidentBarriersService.create(id, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ barrierId, values }: any) => incidentBarriersService.update(id, barrierId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: ({ barrierId, values }: any) => incidentBarriersService.delete(id, barrierId, values), onSuccess: invalidate }),
    importHazop: useMutation({ mutationFn: () => incidentBarriersService.importHazop(id), onSuccess: invalidate }),
    importLopa: useMutation({ mutationFn: () => incidentBarriersService.importLopa(id), onSuccess: invalidate }),
    linkEvidence: useMutation({ mutationFn: ({ barrierId, values }: any) => incidentBarriersService.linkEvidence(id, barrierId, values), onSuccess: invalidate }),
    linkRca: useMutation({ mutationFn: ({ barrierId, values }: any) => incidentBarriersService.linkRca(id, barrierId, values), onSuccess: invalidate }),
    createFollowupAction: useMutation({ mutationFn: (values: any) => incidentBarriersService.createFollowupAction(id, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentBarriersService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentBarriersService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentBarriersService.rejectReview(id, values), onSuccess: invalidate })
  };
}
