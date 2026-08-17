import { useReliefTestMutations } from './useReliefTestMutations';

export function useReliefTestEvaluation(testId?: string) {
  return useReliefTestMutations(testId).evaluate;
}
