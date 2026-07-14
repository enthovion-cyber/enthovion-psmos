'use client';

import { useHazopRecommendationMutations } from './useHazopRecommendationMutations';

export function useHazopRecommendationVerification(studyId: string) {
  const mutations = useHazopRecommendationMutations(studyId);
  return {
    requestVerification: mutations.requestVerification,
    verify: mutations.verify,
    rejectVerification: mutations.rejectVerification
  };
}
