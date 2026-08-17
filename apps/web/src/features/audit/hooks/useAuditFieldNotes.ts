import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditFieldNoteService } from "../services/audit-field-note.service";

export function useAuditFieldNotes() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["audit", "execution"] });
  return {
    add: useMutation({ mutationFn: ({ executionId, payload }: { executionId: string; payload: Record<string, unknown> }) => auditFieldNoteService.add(executionId, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ executionId, noteId, payload }: { executionId: string; noteId: string; payload: Record<string, unknown> }) => auditFieldNoteService.update(executionId, noteId, payload), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ executionId, noteId, reason }: { executionId: string; noteId: string; reason: string }) => auditFieldNoteService.remove(executionId, noteId, reason), onSuccess: invalidate }),
    convert: useMutation({ mutationFn: ({ executionId, noteId, payload }: { executionId: string; noteId: string; payload: Record<string, unknown> }) => auditFieldNoteService.convert(executionId, noteId, payload), onSuccess: invalidate }),
  };
}
