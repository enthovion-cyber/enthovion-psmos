'use client';

import { useQuery } from '@tanstack/react-query';
import { criticalityService } from '../services/criticality.service';

export function useCriticalityAssessment(assessmentId: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'criticality-assessment', assessmentId], queryFn: () => criticalityService.detail(assessmentId), enabled: !!assessmentId });
}
