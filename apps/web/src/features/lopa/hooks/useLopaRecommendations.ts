import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaRecommendationService } from '../services/lopa-recommendation.service';
import type { LopaActionInput, LinkExistingLopaActionInput } from '../types/lopa-action.types';
import type { LopaRecommendationFilters, LopaRecommendationInput } from '../types/lopa-recommendation.types';

export function useLopaRecommendations(id: string, filters: LopaRecommendationFilters = {}) {
  return useQuery({ queryKey: ['lopa', 'recommendations', id, filters], queryFn: () => lopaRecommendationService.get(id, filters), enabled: !!id });
}

export function useLopaRecommendationMutations(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['lopa', 'recommendations', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'detail', id] });
  };
  return {
    create: useMutation({ mutationFn: (values: LopaRecommendationInput) => lopaRecommendationService.create(id, values), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: LopaRecommendationInput }) => lopaRecommendationService.update(id, recommendationId, values), onSuccess: refresh }),
    remove: useMutation({ mutationFn: ({ recommendationId, reason }: { recommendationId: string; reason?: string | undefined }) => lopaRecommendationService.remove(id, recommendationId, reason), onSuccess: refresh }),
    changeStatus: useMutation({ mutationFn: ({ recommendationId, status, reason }: { recommendationId: string; status: string; reason?: string | undefined }) => lopaRecommendationService.changeStatus(id, recommendationId, status, reason), onSuccess: refresh }),
    verify: useMutation({ mutationFn: ({ recommendationId, notes }: { recommendationId: string; notes: string }) => lopaRecommendationService.verify(id, recommendationId, notes), onSuccess: refresh }),
    reopen: useMutation({ mutationFn: ({ recommendationId, reason }: { recommendationId: string; reason?: string | undefined }) => lopaRecommendationService.reopen(id, recommendationId, reason), onSuccess: refresh }),
    createEvidence: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: Record<string, unknown> }) => lopaRecommendationService.createEvidence(id, recommendationId, values), onSuccess: refresh }),
    createAction: useMutation({ mutationFn: (values: LopaActionInput) => lopaRecommendationService.createAction(id, values), onSuccess: refresh }),
    createGapAction: useMutation({ mutationFn: (values: LopaActionInput) => lopaRecommendationService.createGapAction(id, values), onSuccess: refresh }),
    linkAction: useMutation({ mutationFn: (values: LinkExistingLopaActionInput) => lopaRecommendationService.linkAction(id, values), onSuccess: refresh }),
    unlinkAction: useMutation({ mutationFn: ({ actionLinkId, reason }: { actionLinkId: string; reason?: string | undefined }) => lopaRecommendationService.unlinkAction(id, actionLinkId, reason), onSuccess: refresh }),
    syncActions: useMutation({ mutationFn: () => lopaRecommendationService.syncActions(id), onSuccess: refresh }),
    verifyActionClosure: useMutation({ mutationFn: ({ actionId, notes }: { actionId: string; notes?: string | undefined }) => lopaRecommendationService.verifyActionClosure(id, actionId, notes), onSuccess: refresh }),
    sendReminder: useMutation({ mutationFn: (reason?: string) => lopaRecommendationService.sendReminder(id, reason), onSuccess: refresh }),
    escalate: useMutation({ mutationFn: (reason?: string) => lopaRecommendationService.escalate(id, reason), onSuccess: refresh }),
    export: useMutation({ mutationFn: (filters: LopaRecommendationFilters) => lopaRecommendationService.export(id, filters) })
  };
}
