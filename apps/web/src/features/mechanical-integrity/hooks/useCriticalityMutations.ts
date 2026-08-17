'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criticalityService } from '../services/criticality.service';
import type { CriticalityAssessmentInput } from '../types/criticality-assessment.types';

export function useCriticalityMutations(assessmentId?: string, equipmentId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity'] });
  return {
    create: useMutation({ mutationFn: (input: CriticalityAssessmentInput) => criticalityService.create(input), onSuccess: invalidate }),
    createForEquipment: useMutation({ mutationFn: (input: Omit<CriticalityAssessmentInput, 'equipmentId'>) => criticalityService.createForEquipment(equipmentId!, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => criticalityService.update(assessmentId!, input), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: () => criticalityService.recalculate(assessmentId!), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (notes?: string) => criticalityService.submit(assessmentId!, notes), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (comments?: string) => criticalityService.approve(assessmentId!, comments), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (reason: string) => criticalityService.reject(assessmentId!, reason), onSuccess: invalidate }),
    returnForCorrection: useMutation({ mutationFn: (reason: string) => criticalityService.returnForCorrection(assessmentId!, reason), onSuccess: invalidate }),
    createRevision: useMutation({ mutationFn: (reason: string) => criticalityService.createRevision(assessmentId!, reason), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (reason: string) => criticalityService.archive(assessmentId!, reason), onSuccess: invalidate })
  };
}
