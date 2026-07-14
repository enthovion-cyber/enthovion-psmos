'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foundationService, type FoundationInput, type FoundationKind } from '@/services/foundation.service';

export function useCompanyWorkspace() {
  return useQuery({ queryKey: ['workspace', 'context'], queryFn: foundationService.context });
}

export function useWorkspaceReference() {
  return useQuery({
    queryKey: ['workspace', 'reference'],
    queryFn: async () => ({
      companies: await foundationService.companies(),
      sites: await foundationService.sites(),
      departments: await foundationService.departments(),
      units: await foundationService.units(),
      areas: await foundationService.areas()
    })
  });
}

export function useWorkspaceEntityMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['workspace'] }),
      queryClient.invalidateQueries({ queryKey: ['foundation'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment'] }),
      queryClient.invalidateQueries({ queryKey: ['actions'] }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['search'] })
    ]);
  };
  return {
    create: useMutation({ mutationFn: ({ kind, input }: { kind: FoundationKind; input: FoundationInput }) => foundationService.create(kind, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ kind, id, input }: { kind: FoundationKind; id: string; input: FoundationInput }) => foundationService.update(kind, id, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ kind, id, reason }: { kind: FoundationKind; id: string; reason: string }) => foundationService.archive(kind, id, reason), onSuccess: invalidate })
  };
}
