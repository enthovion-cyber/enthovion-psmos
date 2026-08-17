import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { regulatorySettingsService } from '../services/regulatory-settings.service';

export function useRegulatorySettings() {
  return useQuery({ queryKey: ['regulatory', 'settings'], queryFn: regulatorySettingsService.get });
}

export function useRegulatorySettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: regulatorySettingsService.update, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regulatory', 'settings'] }) });
}
