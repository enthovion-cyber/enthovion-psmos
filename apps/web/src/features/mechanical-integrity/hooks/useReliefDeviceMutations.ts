import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reliefDeviceService } from '../services/relief-device.service';

export function useReliefDeviceMutations(reliefDeviceId?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['mechanical-integrity'] });
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefDeviceService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefDeviceService.update(reliefDeviceId!, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (reason: string) => reliefDeviceService.archive(reliefDeviceId!, reason), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: (reason: string) => reliefDeviceService.reactivate(reliefDeviceId!, reason), onSuccess: invalidate }),
    runScheduler: useMutation({ mutationFn: () => reliefDeviceService.runScheduler(), onSuccess: invalidate })
  };
}
