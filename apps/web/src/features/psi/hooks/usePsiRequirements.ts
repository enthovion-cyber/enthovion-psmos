import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

export function usePsiRequirements(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'completeness', 'requirements', filters], queryFn: () => psiCompletenessService.requirements(filters) });
}

export function usePsiRequirement(requirementId?: string) {
  return useQuery({ queryKey: ['psi', 'completeness', 'requirements', requirementId], queryFn: () => psiCompletenessService.requirement(requirementId as string), enabled: Boolean(requirementId) });
}

export function usePsiRequirementMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['psi', 'completeness', 'requirements'] });
  return {
    createRequirement: useMutation({ mutationFn: (input: Record<string, unknown>) => psiCompletenessService.createRequirement(input), onSuccess: invalidate }),
    updateRequirement: useMutation({ mutationFn: ({ requirementId, input }: { requirementId: string; input: Record<string, unknown> }) => psiCompletenessService.updateRequirement(requirementId, input), onSuccess: invalidate }),
    archiveRequirement: useMutation({ mutationFn: ({ requirementId, input }: { requirementId: string; input: Record<string, unknown> }) => psiCompletenessService.archiveRequirement(requirementId, input), onSuccess: invalidate })
  };
}
