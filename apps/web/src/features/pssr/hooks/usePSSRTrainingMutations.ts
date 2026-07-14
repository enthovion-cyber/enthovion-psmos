import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrTrainingReadinessService } from '../services/pssr-training-readiness.service';

export function usePSSRTrainingMutations(pssrId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'training-readiness'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'punch-list'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'history'] });
  };
  return {
    generate: useMutation({ mutationFn: () => pssrTrainingReadinessService.generate(pssrId), onSuccess: invalidate }),
    syncFromMoc: useMutation({ mutationFn: () => pssrTrainingReadinessService.syncFromMoc(pssrId), onSuccess: invalidate }),
    syncFromDocuments: useMutation({ mutationFn: () => pssrTrainingReadinessService.syncFromDocuments(pssrId), onSuccess: invalidate }),
    addRequirement: useMutation({ mutationFn: (values: Record<string, any>) => pssrTrainingReadinessService.addRequirement(pssrId, values), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: (assignmentId: string) => pssrTrainingReadinessService.complete(pssrId, assignmentId), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (assignmentId: string) => pssrTrainingReadinessService.verify(pssrId, assignmentId), onSuccess: invalidate }),
    waive: useMutation({ mutationFn: ({ assignmentId, reason }: { assignmentId: string; reason: string }) => pssrTrainingReadinessService.waive(pssrId, assignmentId, reason), onSuccess: invalidate }),
    acknowledge: useMutation({ mutationFn: (ackId: string) => pssrTrainingReadinessService.acknowledge(pssrId, ackId), onSuccess: invalidate })
  };
}
