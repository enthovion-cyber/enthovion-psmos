import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safeguardSchedulerService } from '../services/safeguard-scheduler.service';
import { sifService } from '../services/sif.service';

export function useSafeguardDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'safeguards', 'dashboard', filters], queryFn: () => sifService.dashboard(filters) });
}

export function useSafeguardSummary(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'safeguards', 'summary', filters], queryFn: () => sifService.summary(filters) });
}

export function useSafeguardHealth(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'safeguards', 'health', filters], queryFn: () => sifService.health(filters) });
}

export function useSafeguardSchedulerRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => safeguardSchedulerService.run(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'safeguards'] })
  });
}
