import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

export function usePsiCompletenessRuns(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'completeness', 'runs', filters], queryFn: () => psiCompletenessService.runHistory(filters) });
}

export function usePsiCompletenessRunMutation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: Record<string, unknown>) => psiCompletenessService.run(input), onSuccess: () => client.invalidateQueries({ queryKey: ['psi', 'completeness'] }) });
}
