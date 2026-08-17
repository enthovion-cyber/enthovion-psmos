'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionPlanService } from '../services/inspection-plan.service';

export function useInspectionPlanDetail(planId: string | null | undefined) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'inspection-plan', planId],
    queryFn: () => inspectionPlanService.get(planId!),
    enabled: !!planId
  });
}
