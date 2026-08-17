import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaMutations(capaId?: string) {
  const client = useQueryClient();
  const invalidate = async () => {
    await client.invalidateQueries({ queryKey: ["audit", "capa"] });
    await client.invalidateQueries({ queryKey: ["audit", "findings"] });
  };
  return {
    create: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditCapaService.create(payload), onSuccess: invalidate }),
    createFromFinding: useMutation({ mutationFn: ({ findingId, payload }: { findingId: string; payload: Record<string, unknown> }) => auditCapaService.createFromFinding(findingId, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditCapaService.update(String(capaId), payload), onSuccess: invalidate }),
    transition: useMutation({ mutationFn: ({ action, payload }: { action: string; payload?: Record<string, unknown> }) => auditCapaService.transition(String(capaId), action, payload ?? {}), onSuccess: invalidate }),
    section: useMutation({ mutationFn: ({ section, payload }: { section: string; payload: Record<string, unknown> }) => auditCapaService.addSection(String(capaId), section, payload), onSuccess: invalidate }),
    actionLifecycle: useMutation({ mutationFn: ({ actionId, lifecycle, payload }: { actionId: string; lifecycle: string; payload?: Record<string, unknown> }) => auditCapaService.actionLifecycle(String(capaId), actionId, lifecycle, payload ?? {}), onSuccess: invalidate }),
    runClosureReadiness: useMutation({ mutationFn: () => auditCapaService.runClosureReadiness(String(capaId)), onSuccess: invalidate }),
  };
}
