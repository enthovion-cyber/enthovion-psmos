import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditChecklistService as s } from "../services/audit-checklist.service";
export function useAuditChecklistMutations() {
  const c = useQueryClient(),
    done = () => c.invalidateQueries({ queryKey: ["audit", "checklists"] });
  return {
    create: useMutation({ mutationFn: s.create, onSuccess: done }),
    update: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: Record<string, unknown>;
      }) => s.update(id, payload),
      onSuccess: done,
    }),
    action: useMutation({
      mutationFn: ({
        id,
        action,
        payload = {},
      }: {
        id: string;
        action: string;
        payload?: Record<string, unknown>;
      }) => s.action(id, action, payload),
      onSuccess: done,
    }),
    addChild: useMutation({
      mutationFn: ({
        id,
        kind,
        payload,
      }: {
        id: string;
        kind: string;
        payload: Record<string, unknown>;
      }) => s.addChild(id, kind, payload),
      onSuccess: done,
    }),
  };
}
