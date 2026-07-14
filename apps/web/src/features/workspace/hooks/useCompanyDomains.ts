'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foundationService, type FoundationInput } from '@/services/foundation.service';

export function useCompanyDomains() {
  return useQuery({ queryKey: ['workspace', 'company-domains'], queryFn: foundationService.domains });
}

export function useCompanyDomainMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => queryClient.invalidateQueries({ queryKey: ['workspace', 'company-domains'] });
  return {
    create: useMutation({ mutationFn: (input: FoundationInput) => foundationService.createDomain(input), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (domainId: string) => foundationService.verifyDomain(domainId), onSuccess: invalidate })
  };
}
