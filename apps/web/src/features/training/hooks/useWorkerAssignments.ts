import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workerAssignmentService } from '../services/worker-assignment.service';

export function useWorkerAssignments(workerId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['training', 'worker', workerId] });
  return {
    addAssignment: useMutation({ mutationFn: (values: Record<string, any>) => workerAssignmentService.add(workerId, values), onSuccess: invalidate }),
    addRole: useMutation({ mutationFn: (values: Record<string, any>) => workerAssignmentService.addRole(workerId, values), onSuccess: invalidate })
  };
}
