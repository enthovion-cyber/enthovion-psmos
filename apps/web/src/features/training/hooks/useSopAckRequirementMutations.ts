import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAckRequirementMutations(requirementId?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'sop-ack'] });
  return {
    create: useMutation({ mutationFn: sopAckService.createRequirement, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (payload: Record<string, unknown>) => sopAckService.updateRequirement(String(requirementId), payload), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: (payload?: Record<string, unknown>) => sopAckService.activateRequirement(String(requirementId), payload), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (payload: Record<string, unknown>) => sopAckService.archiveRequirement(String(requirementId), payload), onSuccess: invalidate }),
    generateAssignments: useMutation({ mutationFn: (payload?: Record<string, unknown>) => sopAckService.generateAssignments(String(requirementId), payload), onSuccess: invalidate }),
    evaluate: useMutation({ mutationFn: (payload?: Record<string, unknown>) => sopAckService.evaluateRequirement(String(requirementId), payload), onSuccess: invalidate })
  };
}
