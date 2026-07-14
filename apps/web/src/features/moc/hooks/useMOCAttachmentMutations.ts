'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mocAttachmentsService } from '../services/moc-attachments.service';

export function useMOCAttachmentMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'attachments'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'attachments-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'history'] })
    ]);
  };
  return {
    upload: useMutation({ mutationFn: (v: any) => mocAttachmentsService.upload(id, v), onSuccess: refresh }),
    delete: useMutation({ mutationFn: (attachmentId: string) => mocAttachmentsService.delete(id, attachmentId), onSuccess: refresh }),
    linkDocument: useMutation({ mutationFn: (v: any) => mocAttachmentsService.linkDocument(id, v), onSuccess: refresh }),
    preview: useMutation({ mutationFn: (attachmentId: string) => mocAttachmentsService.preview(id, attachmentId) }),
    download: useMutation({ mutationFn: (attachmentId: string) => mocAttachmentsService.download(id, attachmentId) })
  };
}
