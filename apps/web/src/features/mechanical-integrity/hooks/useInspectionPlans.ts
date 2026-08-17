'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionPlanService } from '../services/inspection-plan.service';

export function useInspectionPlans(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'inspection-plans', equipmentId ?? 'all', filters],
    queryFn: () => equipmentId ? inspectionPlanService.equipmentRegistry(equipmentId, filters) : inspectionPlanService.registry(filters)
  });
}
