import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingApprovalSettingsService } from '../services/training-approval-settings.service';

export function useTrainingApprovalSettings(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'review', 'settings', params], queryFn: () => trainingApprovalSettingsService.settings(params) });
}
export function useTrainingApprovalSettingsMutations() {
  const client = useQueryClient();
  return { updateSettings: useMutation({ mutationFn: trainingApprovalSettingsService.updateSettings, onSuccess: () => client.invalidateQueries({ queryKey: ['training', 'review', 'settings'] }) }) };
}
export function useTrainingApprovalEsignatures(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'review', 'esignatures', params], queryFn: () => trainingApprovalSettingsService.esignatures(params) });
}
export function useTrainingApprovalEscalations(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'review', 'escalations', params], queryFn: () => trainingApprovalSettingsService.escalations(params) });
}
