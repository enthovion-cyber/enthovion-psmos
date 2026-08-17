import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

export function usePsiCompletenessSettings() {
  return useQuery({ queryKey: ['psi', 'completeness', 'settings'], queryFn: () => psiCompletenessService.settings() });
}

export function usePsiCompletenessSettingsMutation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: Record<string, unknown>) => psiCompletenessService.updateSettings(input), onSuccess: () => client.invalidateQueries({ queryKey: ['psi', 'completeness', 'settings'] }) });
}
