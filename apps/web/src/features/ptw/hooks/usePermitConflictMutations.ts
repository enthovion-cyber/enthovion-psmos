import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConflictOverrideValues, MatrixRuleValues, SimopsControlValues, SimopsReviewValues } from '../schemas/conflict.schema';
import { ptwConflictService } from '../services/ptw-conflict.service';

export function usePermitConflictMutations(permitId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ptw'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'conflicts'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'simops'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', 'conflict-matrix'] })
  ]);
  return {
    runCheck: useMutation({ mutationFn: () => ptwConflictService.runCheck(permitId), onSuccess: invalidate }),
    resolve: useMutation({ mutationFn: ({ conflictId, notes }: { conflictId: string; notes: string }) => ptwConflictService.resolve(permitId, conflictId, notes), onSuccess: invalidate }),
    falsePositive: useMutation({ mutationFn: ({ conflictId, notes }: { conflictId: string; notes: string }) => ptwConflictService.falsePositive(permitId, conflictId, notes), onSuccess: invalidate }),
    requestOverride: useMutation({ mutationFn: ({ conflictId, input }: { conflictId: string; input: ConflictOverrideValues }) => ptwConflictService.requestOverride(permitId, conflictId, input), onSuccess: invalidate }),
    approveOverride: useMutation({ mutationFn: ({ conflictId, input }: { conflictId: string; input: ConflictOverrideValues }) => ptwConflictService.approveOverride(permitId, conflictId, input), onSuccess: invalidate }),
    rejectOverride: useMutation({ mutationFn: ({ conflictId, reason }: { conflictId: string; reason: string }) => ptwConflictService.rejectOverride(permitId, conflictId, reason), onSuccess: invalidate }),
    saveSimops: useMutation({ mutationFn: ({ input, simopsId }: { input: SimopsReviewValues; simopsId?: string | undefined }) => ptwConflictService.saveSimops(permitId, input, simopsId), onSuccess: invalidate }),
    approveSimops: useMutation({ mutationFn: (simopsId: string) => ptwConflictService.approveSimops(permitId, simopsId), onSuccess: invalidate }),
    rejectSimops: useMutation({ mutationFn: ({ simopsId, reason }: { simopsId: string; reason: string }) => ptwConflictService.rejectSimops(permitId, simopsId, reason), onSuccess: invalidate }),
    acknowledgeControlRoom: useMutation({ mutationFn: (simopsId: string) => ptwConflictService.acknowledgeControlRoom(permitId, simopsId), onSuccess: invalidate }),
    addControl: useMutation({ mutationFn: ({ simopsId, input }: { simopsId: string; input: SimopsControlValues }) => ptwConflictService.addControl(permitId, simopsId, input), onSuccess: invalidate }),
    createMatrix: useMutation({ mutationFn: (input: MatrixRuleValues) => ptwConflictService.createMatrix(input), onSuccess: invalidate }),
    updateMatrix: useMutation({ mutationFn: ({ ruleId, input }: { ruleId: string; input: MatrixRuleValues }) => ptwConflictService.updateMatrix(ruleId, input), onSuccess: invalidate }),
    deleteMatrix: useMutation({ mutationFn: (ruleId: string) => ptwConflictService.deleteMatrix(ruleId), onSuccess: invalidate })
  };
}
