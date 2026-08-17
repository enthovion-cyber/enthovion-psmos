import { useMutation, useQueryClient } from '@tanstack/react-query';
import { psiChemicalService } from '../services/psi-chemical.service';

export function usePsiChemicalMutations(chemicalId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['psi', 'chemicals'] });
  return {
    create: useMutation({ mutationFn: psiChemicalService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => psiChemicalService.update(chemicalId as string, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => psiChemicalService.archive(chemicalId as string, input), onSuccess: invalidate }),
    linkSds: useMutation({ mutationFn: (input: Record<string, unknown>) => psiChemicalService.linkSds(chemicalId as string, input), onSuccess: invalidate }),
    runSdsCheck: useMutation({ mutationFn: () => psiChemicalService.runSdsCheck(chemicalId as string), onSuccess: invalidate }),
    runCompatibilityCheck: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => psiChemicalService.runCompatibilityCheck(chemicalId as string, input), onSuccess: invalidate })
  };
}
