'use client';

import { useHazopRecommendationMutations } from './useHazopRecommendationMutations';

export function useHazopActionLinks(studyId: string) {
  const mutations = useHazopRecommendationMutations(studyId);
  return {
    createAction: mutations.createAction,
    linkAction: mutations.linkAction,
    unlinkAction: mutations.unlinkAction,
    syncAction: mutations.syncAction
  };
}
