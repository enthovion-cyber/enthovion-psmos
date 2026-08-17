import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miLinkedRecordService } from '../services/linked-record.service';

export function useLinkedRecordMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity'] });
  return {
    create: useMutation({ mutationFn: miLinkedRecordService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: { id: string; values: Record<string, unknown> }) => miLinkedRecordService.update(input.id, input.values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: miLinkedRecordService.remove, onSuccess: invalidate })
  };
}
