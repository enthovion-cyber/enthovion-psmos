'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foundationService, type FoundationInput, type FoundationKind } from '@/services/foundation.service';

export function useFoundationContext() {
  return useQuery({ queryKey: ['foundation', 'context'], queryFn: foundationService.context });
}

export function useFoundationReference() {
  return useQuery({
    queryKey: ['foundation', 'reference'],
    queryFn: async () => ({
      companies: await foundationService.companies(),
      sites: await foundationService.sites(),
      departments: await foundationService.departments(),
      units: await foundationService.units(),
      areas: await foundationService.areas()
    })
  });
}

export function useFoundationMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['foundation'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment'] }),
      queryClient.invalidateQueries({ queryKey: ['actions'] }),
      queryClient.invalidateQueries({ queryKey: ['search'] })
    ]);
  };
  return {
    create: useMutation({ mutationFn: ({ kind, input }: { kind: FoundationKind; input: FoundationInput }) => foundationService.create(kind, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ kind, id, input }: { kind: FoundationKind; id: string; input: FoundationInput }) => foundationService.update(kind, id, input), onSuccess: invalidate })
  };
}
