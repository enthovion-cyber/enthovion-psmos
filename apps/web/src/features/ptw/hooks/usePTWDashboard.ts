import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ptwDashboardService } from '../services/ptw-dashboard.service';

export function usePTWDashboard() {
  return useQuery({
    queryKey: ['ptw', 'dashboard', 'overview'],
    queryFn: ptwDashboardService.overview,
    refetchInterval: 30000
  });
}

export function usePTWDashboardPanels() {
  return {
    alerts: useQuery({ queryKey: ['ptw', 'dashboard', 'alerts'], queryFn: ptwDashboardService.alerts, refetchInterval: 30000 }),
    expiring: useQuery({ queryKey: ['ptw', 'dashboard', 'expiring'], queryFn: ptwDashboardService.expiring, refetchInterval: 30000 }),
    gasRetest: useQuery({ queryKey: ['ptw', 'dashboard', 'gas-retest'], queryFn: ptwDashboardService.gasRetest, refetchInterval: 30000 }),
    conflicts: useQuery({ queryKey: ['ptw', 'dashboard', 'conflicts'], queryFn: ptwDashboardService.conflicts, refetchInterval: 30000 }),
    isolation: useQuery({ queryKey: ['ptw', 'dashboard', 'isolation'], queryFn: ptwDashboardService.isolation, refetchInterval: 30000 }),
    handover: useQuery({ queryKey: ['ptw', 'dashboard', 'handover'], queryFn: ptwDashboardService.handover, refetchInterval: 30000 }),
    safetyCritical: useQuery({ queryKey: ['ptw', 'dashboard', 'safety-critical'], queryFn: ptwDashboardService.safetyCritical, refetchInterval: 30000 }),
    areaOverview: useQuery({ queryKey: ['ptw', 'dashboard', 'area-overview'], queryFn: ptwDashboardService.areaOverview, refetchInterval: 30000 })
  };
}

export function usePTWDashboardActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ptw'] });
  return {
    runConflictScan: useMutation({ mutationFn: ptwDashboardService.runConflictScan, onSuccess: invalidate }),
    exportPdf: useMutation({ mutationFn: ptwDashboardService.exportPdf, onSuccess: invalidate }),
    exportCsv: useMutation({ mutationFn: ptwDashboardService.exportCsv, onSuccess: invalidate })
  };
}
