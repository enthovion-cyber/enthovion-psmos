import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentImmediateActionsService } from '../services/incident-immediate-actions.service';

export function useIncidentImmediateActions(id: string) {
  return useQuery({ queryKey: ['incidents', 'immediate-actions', id], queryFn: () => incidentImmediateActionsService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentImmediateActionsMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'immediate-actions', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    updateSiteSafety: useMutation({ mutationFn: (values: any) => incidentImmediateActionsService.updateSiteSafety(id, values), onSuccess: invalidate }),
    updateRestartControl: useMutation({ mutationFn: (values: any) => incidentImmediateActionsService.updateRestartControl(id, values), onSuccess: invalidate }),
    create: useMutation({ mutationFn: (values: any) => incidentImmediateActionsService.create(id, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.update(id, actionId, values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (actionId: string) => incidentImmediateActionsService.remove(id, actionId), onSuccess: invalidate }),
    convertCapa: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.convertCapa(id, actionId, values), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.complete(id, actionId, values), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.verify(id, actionId, values), onSuccess: invalidate }),
    rejectVerification: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.rejectVerification(id, actionId, values), onSuccess: invalidate }),
    linkEvidence: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.linkEvidence(id, actionId, values), onSuccess: invalidate }),
    linkCapa: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.linkCapa(id, actionId, values), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.cancel(id, actionId, values), onSuccess: invalidate }),
    createFollowup: useMutation({ mutationFn: ({ actionId, values }: any) => incidentImmediateActionsService.createFollowup(id, actionId, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentImmediateActionsService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentImmediateActionsService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentImmediateActionsService.rejectReview(id, values), onSuccess: invalidate })
  };
}
