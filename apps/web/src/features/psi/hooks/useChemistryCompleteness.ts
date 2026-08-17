import { useMutation, useQueryClient } from '@tanstack/react-query';
import { processChemistryCompletenessService } from '../services/process-chemistry-completeness.service';

export function useChemistryCompleteness(chemistryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => processChemistryCompletenessService.run(chemistryId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['psi', 'process-chemistry-detail', chemistryId] })
  });
}
