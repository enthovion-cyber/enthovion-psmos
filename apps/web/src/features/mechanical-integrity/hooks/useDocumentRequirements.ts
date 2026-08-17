import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { miDocumentRequirementService } from '../services/document-requirement.service';
import { miDocumentService } from '../services/mi-document.service';

export function useDocumentRequirements(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'document-requirements', params], queryFn: () => miDocumentRequirementService.list(params) });
}

export function useDocumentRequirementMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity'] });
  return {
    create: useMutation({ mutationFn: miDocumentRequirementService.create, onSuccess: invalidate }),
    evaluate: useMutation({ mutationFn: miDocumentService.evaluate, onSuccess: invalidate }),
    requestWaiver: useMutation({ mutationFn: (input: { id: string; values: Record<string, unknown> }) => miDocumentRequirementService.requestWaiver(input.id, input.values), onSuccess: invalidate })
  };
}
