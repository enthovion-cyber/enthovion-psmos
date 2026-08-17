import { useQuery } from '@tanstack/react-query';
import { calibrationPlanService } from '../services/calibration-plan.service';

export function useCalibrationPlans(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'calibration-plans', equipmentId ?? 'all', filters], queryFn: () => calibrationPlanService.registry(filters, equipmentId) });
}

export function useCalibrationDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'calibration-dashboard', filters], queryFn: () => calibrationPlanService.dashboard(filters) });
}

export function useCalibrationPlan(planId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'calibration-plan', planId], queryFn: () => calibrationPlanService.get(planId!), enabled: !!planId });
}

