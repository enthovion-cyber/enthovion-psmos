import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hazopPsiBasisService, miPsiReadinessService, mocPsiImpactService, psiIntegrationService, pssrPsiReadinessService } from '../services/psi-integration.service';

export function usePsiIntegrationDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'integrations', 'dashboard', filters], queryFn: () => psiIntegrationService.dashboard(filters) });
}

export function useIntegrationImpactRegister(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'integrations', 'impact-register', filters], queryFn: () => psiIntegrationService.impactRegister(filters) });
}

export function useMocPsiImpact(mocId: string, enabled = true) {
  return useQuery({ queryKey: ['psi', 'integrations', 'moc', mocId], queryFn: () => mocPsiImpactService.get(mocId), enabled: enabled && Boolean(mocId) });
}

export function usePssrPsiReadiness(pssrId: string, enabled = true) {
  return useQuery({ queryKey: ['psi', 'integrations', 'pssr', pssrId], queryFn: () => pssrPsiReadinessService.get(pssrId), enabled: enabled && Boolean(pssrId) });
}

export function useHazopPsiBasis(hazopId: string, enabled = true) {
  return useQuery({ queryKey: ['psi', 'integrations', 'hazop', hazopId], queryFn: () => hazopPsiBasisService.get(hazopId), enabled: enabled && Boolean(hazopId) });
}

export function useMiPsiReadiness(equipmentId: string, enabled = true) {
  return useQuery({ queryKey: ['psi', 'integrations', 'mi', equipmentId], queryFn: () => miPsiReadinessService.get(equipmentId), enabled: enabled && Boolean(equipmentId) });
}

export function useOutOfSyncChecks(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'integrations', 'out-of-sync', filters], queryFn: () => psiIntegrationService.outOfSync(filters) });
}

export function usePsiIntegrationSettings() {
  return useQuery({ queryKey: ['psi', 'integrations', 'settings'], queryFn: () => psiIntegrationService.settings() });
}

export function usePsiIntegrationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { action: 'runSync' | 'updateSettings'; id?: string; data?: Record<string, unknown> }) => {
      if (input.action === 'updateSettings') return psiIntegrationService.updateSettings(input.data ?? {});
      return psiIntegrationService.runSync(input.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['psi', 'integrations'] })
  });
}
