import { useQuery } from '@tanstack/react-query';
import { pmPlanService } from '../services/pm-plan.service';

export function usePmPlans(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'pm-plans', equipmentId ?? 'all', filters], queryFn: () => pmPlanService.registry(filters, equipmentId) });
}

export function usePmDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'pm-dashboard', filters], queryFn: () => pmPlanService.dashboard(filters) });
}

export function usePmPlan(planId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'pm-plan', planId], queryFn: () => pmPlanService.get(planId!), enabled: !!planId });
}

