'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionRecordService } from '../services/inspection-record.service';

export function useInspectionRecordMutations(inspectionId?: string, equipmentId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'inspection-records'] });
    if (inspectionId) void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'inspection-record', inspectionId] });
    if (equipmentId) void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'remaining-life', equipmentId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionRecordService.create(input, equipmentId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionRecordService.update(inspectionId ?? '', input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (reason: string) => inspectionRecordService.archive(inspectionId ?? '', reason), onSuccess: invalidate }),
    updateChecklist: useMutation({ mutationFn: ({ itemId, input }: { itemId: string; input: Record<string, unknown> }) => inspectionRecordService.updateChecklistItem(inspectionId ?? '', itemId, input), onSuccess: invalidate }),
    addReading: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionRecordService.addReading(inspectionId ?? '', input), onSuccess: invalidate }),
    updateReading: useMutation({ mutationFn: ({ readingId, input }: { readingId: string; input: Record<string, unknown> }) => inspectionRecordService.updateReading(inspectionId ?? '', readingId, input), onSuccess: invalidate }),
    approveReading: useMutation({ mutationFn: (readingId: string) => inspectionRecordService.approveReading(inspectionId ?? '', readingId), onSuccess: invalidate }),
    rejectReading: useMutation({ mutationFn: ({ readingId, reason }: { readingId: string; reason: string }) => inspectionRecordService.rejectReading(inspectionId ?? '', readingId, reason), onSuccess: invalidate }),
    approveAllReadings: useMutation({ mutationFn: () => inspectionRecordService.approveAllReadings(inspectionId ?? ''), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: () => inspectionRecordService.recalculate(inspectionId ?? ''), onSuccess: invalidate }),
    addFinding: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionRecordService.addFinding(inspectionId ?? '', input), onSuccess: invalidate }),
    updateFinding: useMutation({ mutationFn: ({ findingId, input }: { findingId: string; input: Record<string, unknown> }) => inspectionRecordService.updateFinding(inspectionId ?? '', findingId, input), onSuccess: invalidate }),
    closeFinding: useMutation({ mutationFn: ({ findingId, reason }: { findingId: string; reason: string }) => inspectionRecordService.closeFinding(inspectionId ?? '', findingId, reason), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (comment?: string) => inspectionRecordService.submit(inspectionId ?? '', comment), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionRecordService.approve(inspectionId ?? '', input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (reason: string) => inspectionRecordService.reject(inspectionId ?? '', reason), onSuccess: invalidate }),
    returnForCorrection: useMutation({ mutationFn: (reason: string) => inspectionRecordService.returnForCorrection(inspectionId ?? '', reason), onSuccess: invalidate }),
    addDocument: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionRecordService.addDocument(inspectionId ?? '', input), onSuccess: invalidate })
  };
}
