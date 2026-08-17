import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingMatrixService } from '../services/training-matrix.service';

export function useMatrixSettings() {
  return useQuery({ queryKey: ['training-matrix-settings'], queryFn: () => trainingMatrixService.settings() });
}

export function useMatrixSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixService.updateSettings(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['training-matrix-settings'] }) });
}
