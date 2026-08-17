'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criticalityService } from '../services/criticality.service';

export function useRiskCalculation(assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => criticalityService.recalculate(assessmentId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'criticality-assessment', assessmentId] }) });
}
