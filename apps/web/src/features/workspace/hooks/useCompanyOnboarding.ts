'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { foundationService, type FoundationInput } from '@/services/foundation.service';

export function useCompanyOnboarding() {
  const queryClient = useQueryClient();
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: ['workspace'] });
  return {
    start: useMutation({ mutationFn: (input: FoundationInput) => foundationService.startOnboarding(input), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: (input: FoundationInput) => foundationService.completeOnboarding(input), onSuccess: invalidate })
  };
}
