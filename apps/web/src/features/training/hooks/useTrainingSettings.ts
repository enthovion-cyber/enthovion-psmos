import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingSettingsService } from '../services/training-settings.service';

export function useTrainingSettings() {
  return useQuery({ queryKey: ['training', 'settings'], queryFn: trainingSettingsService.get });
}

export function useTrainingSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: trainingSettingsService.update, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training', 'settings'] }) });
}
