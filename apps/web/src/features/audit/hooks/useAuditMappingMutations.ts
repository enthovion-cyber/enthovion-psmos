import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditMappingService } from "../services/audit-mapping.service";
export function useAuditMappingMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["audit", "standards-mapping"] });
  return {
    save: useMutation({ mutationFn: ({ payload, id }: { payload: Record<string, unknown>; id?: string }) => auditMappingService.save(payload, id), onSuccess: done }),
    link: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => auditMappingService.link(id, payload), onSuccess: done }),
    recalculate: useMutation({ mutationFn: (id?: string) => auditMappingService.recalculate(id), onSuccess: done }),
    transition: useMutation({ mutationFn: ({ id, action, payload }: { id: string; action: "verify" | "mark-stale" | "archive" | "reopen"; payload?: Record<string, unknown> }) => auditMappingService.transition(id, action, payload), onSuccess: done }),
    snapshotTraceability: useMutation({ mutationFn: (id: string) => auditMappingService.snapshotTraceability(id), onSuccess: done }),
  };
}
