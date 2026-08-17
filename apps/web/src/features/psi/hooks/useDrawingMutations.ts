import { useMutation, useQueryClient } from '@tanstack/react-query';
import { drawingService } from '../services/drawing.service';

export function useDrawingMutations(drawingId?: string | undefined, unitId?: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['psi', 'drawings'] });
    if (drawingId) await queryClient.invalidateQueries({ queryKey: ['psi', 'drawing', drawingId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => unitId ? drawingService.createForUnit(unitId, input) : drawingService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.update(String(drawingId), input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.archive(String(drawingId), input), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.linkDocument(String(drawingId), input), onSuccess: invalidate }),
    syncDocumentStatus: useMutation({ mutationFn: () => drawingService.syncDocumentStatus(String(drawingId)), onSuccess: invalidate }),
    updateScope: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.updateScope(String(drawingId), input), onSuccess: invalidate }),
    addRelationship: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.addRelationship(String(drawingId), input), onSuccess: invalidate }),
    addTag: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.addTag(String(drawingId), input), onSuccess: invalidate }),
    importTagIndex: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.importTagIndex(String(drawingId), input), onSuccess: invalidate }),
    verifyTagIndex: useMutation({ mutationFn: () => drawingService.verifyTagIndex(String(drawingId)), onSuccess: invalidate }),
    updateMocRedlines: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.updateMocRedlines(String(drawingId), input), onSuccess: invalidate }),
    markAsBuiltVerified: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.markAsBuiltVerified(String(drawingId), input), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => drawingService.runCompleteness(String(drawingId)), onSuccess: invalidate }),
    runConflictCheck: useMutation({ mutationFn: () => drawingService.runConflictCheck(String(drawingId)), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown>) => drawingService.submitReview(String(drawingId), input), onSuccess: invalidate })
  };
}
