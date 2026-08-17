import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditExecutionService } from "../services/audit-execution.service";

export function useAuditExecutionMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["audit", "execution"] });
  return {
    create: useMutation({ mutationFn: auditExecutionService.create, onSuccess: invalidate }),
    startFromPlan: useMutation({ mutationFn: ({ planId, payload }: { planId: string; payload: Record<string, unknown> }) => auditExecutionService.startFromPlan(planId, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => auditExecutionService.update(id, payload), onSuccess: invalidate }),
    action: useMutation({ mutationFn: ({ id, action, payload = {} }: { id: string; action: string; payload?: Record<string, unknown> }) => auditExecutionService.action(id, action, payload), onSuccess: invalidate }),
    readiness: useMutation({ mutationFn: (id: string) => auditExecutionService.readiness(id, true), onSuccess: invalidate }),
    validate: useMutation({ mutationFn: (id: string) => auditExecutionService.validate(id), onSuccess: invalidate }),
  };
}
