'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopAttachmentService } from '../services/hazop-attachment.service';

export function useHazopAttachmentMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'attachments'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'history'] });
  };
  return {
    upload: useMutation({ mutationFn: (values: Record<string, any>) => hazopAttachmentService.upload(studyId, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ attachmentId, values }: { attachmentId: string; values: Record<string, any> }) => hazopAttachmentService.update(studyId, attachmentId, values), onSuccess: invalidate }),
    replace: useMutation({ mutationFn: ({ attachmentId, values }: { attachmentId: string; values: Record<string, any> }) => hazopAttachmentService.replace(studyId, attachmentId, values), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ attachmentId, values }: { attachmentId: string; values: Record<string, any> }) => hazopAttachmentService.archive(studyId, attachmentId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: ({ attachmentId, values }: { attachmentId: string; values: Record<string, any> }) => hazopAttachmentService.delete(studyId, attachmentId, values), onSuccess: invalidate }),
    exportRegister: useMutation({ mutationFn: () => hazopAttachmentService.export(studyId) }),
    download: useMutation({ mutationFn: (attachmentId: string) => hazopAttachmentService.download(studyId, attachmentId) })
  };
}
