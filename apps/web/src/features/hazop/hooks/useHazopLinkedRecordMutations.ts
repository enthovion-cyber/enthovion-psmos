'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopLinkedRecordService } from '../services/hazop-linked-record.service';

export function useHazopLinkedRecordMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'linked-records'] });
  };
  return {
    create: useMutation({ mutationFn: (values: Record<string, any>) => hazopLinkedRecordService.create(studyId, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ linkId, values }: { linkId: string; values: Record<string, any> }) => hazopLinkedRecordService.update(studyId, linkId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: ({ linkId, reason }: { linkId: string; reason?: string }) => hazopLinkedRecordService.delete(studyId, linkId, reason), onSuccess: invalidate }),
    sync: useMutation({ mutationFn: (linkId: string) => hazopLinkedRecordService.sync(studyId, linkId), onSuccess: invalidate }),
    markBlocking: useMutation({ mutationFn: ({ linkId, values }: { linkId: string; values: Record<string, any> }) => hazopLinkedRecordService.markBlocking(studyId, linkId, values), onSuccess: invalidate }),
    resolveBlocker: useMutation({ mutationFn: ({ linkId, blockerId, values }: { linkId: string; blockerId: string; values: Record<string, any> }) => hazopLinkedRecordService.resolveBlocker(studyId, linkId, blockerId, values), onSuccess: invalidate }),
    exportRegister: useMutation({ mutationFn: () => hazopLinkedRecordService.export(studyId) })
  };
}
