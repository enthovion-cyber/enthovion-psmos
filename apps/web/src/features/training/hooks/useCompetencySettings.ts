import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { competencySettingsService } from '../services/competency-settings.service';

export function useCompetencySettings() {
  return useQuery({ queryKey: ['competency-settings'], queryFn: competencySettingsService.get });
}

export function useCompetencySettingsMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: competencySettingsService.update, onSuccess: () => qc.invalidateQueries({ queryKey: ['competency-settings'] }) });
}
