'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hazopIplService } from '../services/hazop-ipl.service';

export function useHazopIplValidation(studyId: string, safeguardId?: string) {
  return useQuery({ queryKey: ['hazop', studyId, 'ipl-validation', safeguardId], queryFn: () => hazopIplService.getValidation(studyId, safeguardId ?? ''), enabled: Boolean(studyId && safeguardId) });
}

export function useHazopIplValidationMutations(studyId: string, safeguardId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'ipl-validation', safeguardId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'safeguards-register'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'safeguards-ipl-candidates'] });
  };
  return {
    create: useMutation({ mutationFn: (values: Record<string, any>) => hazopIplService.createValidation(studyId, safeguardId, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ validationId, values }: { validationId: string; values: Record<string, any> }) => hazopIplService.updateValidation(studyId, safeguardId, validationId, values), onSuccess: invalidate }),
    finalize: useMutation({ mutationFn: (validationId: string) => hazopIplService.finalizeValidation(studyId, safeguardId, validationId), onSuccess: invalidate })
  };
}
