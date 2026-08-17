'use client';

import { useCriticalityMutations } from './useCriticalityMutations';

export function useCriticalityReview(assessmentId: string) {
  const mutations = useCriticalityMutations(assessmentId);
  return { submit: mutations.submit, approve: mutations.approve, reject: mutations.reject, returnForCorrection: mutations.returnForCorrection };
}
