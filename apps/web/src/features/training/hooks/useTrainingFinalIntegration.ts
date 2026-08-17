import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingFinalIntegrationService } from '../services/training-final-integration.service';

export function useTrainingFinalIntegrationDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'final-integration', 'dashboard', filters], queryFn: () => trainingFinalIntegrationService.dashboard(filters) });
}

export function useTrainingFinalIntegrationSettings() {
  return useQuery({ queryKey: ['training', 'final-integration', 'settings'], queryFn: trainingFinalIntegrationService.settings });
}

export function useTrainingFinalIntegrationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['training', 'final-integration'] });
  return {
    recalculateSnapshots: useMutation({ mutationFn: trainingFinalIntegrationService.recalculateSnapshots, onSuccess: invalidate }),
    runIntegrationHealth: useMutation({ mutationFn: trainingFinalIntegrationService.runIntegrationHealth, onSuccess: invalidate }),
    runDataQuality: useMutation({ mutationFn: trainingFinalIntegrationService.runDataQuality, onSuccess: invalidate }),
    runHardening: useMutation({ mutationFn: trainingFinalIntegrationService.runHardening, onSuccess: invalidate }),
    updateSettings: useMutation({ mutationFn: trainingFinalIntegrationService.updateSettings, onSuccess: invalidate })
  };
}
