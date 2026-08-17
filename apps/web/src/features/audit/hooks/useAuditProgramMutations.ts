import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditProgramService } from '../services/audit-program.service';

export function useAuditProgramMutations(programId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['audit'] });
  return {
    create: useMutation({ mutationFn: auditProgramService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditProgramService.update(String(programId), payload), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: (id?: string) => auditProgramService.activate(String(id ?? programId)), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ id, reason }: { id?: string; reason: string }) => auditProgramService.archive(String(id ?? programId), reason), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: (id?: string) => auditProgramService.reactivate(String(id ?? programId)), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (id?: string) => auditProgramService.submitReview(String(id ?? programId)), onSuccess: invalidate }),
    calculateHealth: useMutation({ mutationFn: (id?: string) => auditProgramService.calculateHealth(String(id ?? programId)), onSuccess: invalidate })
  };
}
