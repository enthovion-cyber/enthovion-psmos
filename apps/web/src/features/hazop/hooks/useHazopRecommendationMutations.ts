'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopRecommendationActionService } from '../services/hazop-recommendation-action.service';
import { hazopRecommendationService } from '../services/hazop-recommendation.service';

export function useHazopRecommendationMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'recommendations-summary'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'recommendations-register'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'recommendations-overdue'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'recommendations-blockers'] });
  };
  return {
    create: useMutation({ mutationFn: (values: Record<string, any>) => hazopRecommendationService.create(studyId, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: Record<string, any> }) => hazopRecommendationService.update(studyId, recommendationId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: (recommendationId: string) => hazopRecommendationService.delete(studyId, recommendationId), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: Record<string, any> }) => hazopRecommendationService.cancel(studyId, recommendationId, values), onSuccess: invalidate }),
    defer: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: Record<string, any> }) => hazopRecommendationService.defer(studyId, recommendationId, values), onSuccess: invalidate }),
    requestVerification: useMutation({ mutationFn: (recommendationId: string) => hazopRecommendationService.requestVerification(studyId, recommendationId), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: Record<string, any> }) => hazopRecommendationService.verify(studyId, recommendationId, values), onSuccess: invalidate }),
    rejectVerification: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: Record<string, any> }) => hazopRecommendationService.rejectVerification(studyId, recommendationId, values), onSuccess: invalidate }),
    addEvidence: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: Record<string, any> }) => hazopRecommendationService.addEvidence(studyId, recommendationId, values), onSuccess: invalidate }),
    createAction: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values?: Record<string, any> }) => hazopRecommendationActionService.createAction(studyId, recommendationId, values), onSuccess: invalidate }),
    linkAction: useMutation({ mutationFn: ({ recommendationId, values }: { recommendationId: string; values: Record<string, any> }) => hazopRecommendationActionService.linkAction(studyId, recommendationId, values), onSuccess: invalidate }),
    unlinkAction: useMutation({ mutationFn: (recommendationId: string) => hazopRecommendationActionService.unlinkAction(studyId, recommendationId), onSuccess: invalidate }),
    syncAction: useMutation({ mutationFn: (recommendationId: string) => hazopRecommendationActionService.syncAction(studyId, recommendationId), onSuccess: invalidate }),
    exportRegister: useMutation({ mutationFn: () => hazopRecommendationService.export(studyId) })
  };
}
