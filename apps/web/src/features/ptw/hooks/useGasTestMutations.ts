import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GasTestValues, GasThresholdValues } from '../schemas/gas-test.schema';
import { ptwGasTestService } from '../services/ptw-gas-test.service';

export function useGasTestMutations(permitId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ptw'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'summary'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'history'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'gas-tests'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'gas-thresholds'] })
  ]);

  return {
    create: useMutation({ mutationFn: (input: GasTestValues) => ptwGasTestService.create(permitId, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<GasTestValues> }) => ptwGasTestService.update(permitId, id, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => ptwGasTestService.remove(permitId, id), onSuccess: invalidate }),
    validate: useMutation({ mutationFn: (id: string) => ptwGasTestService.validate(permitId, id), onSuccess: invalidate }),
    checkOverdue: useMutation({ mutationFn: () => ptwGasTestService.checkOverdue(permitId), onSuccess: invalidate }),
    createThreshold: useMutation({ mutationFn: (input: GasThresholdValues) => ptwGasTestService.createThreshold(input), onSuccess: invalidate }),
    updateThreshold: useMutation({ mutationFn: ({ id, input }: { id: string; input: GasThresholdValues }) => ptwGasTestService.updateThreshold(id, input), onSuccess: invalidate }),
    removeThreshold: useMutation({ mutationFn: (id: string) => ptwGasTestService.removeThreshold(id), onSuccess: invalidate })
  };
}
