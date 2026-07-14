import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrAttachmentsService } from '../services/pssr-attachments.service';

export function usePSSRAttachmentMutations(pssrId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'attachments'] });
    queryClient.invalidateQueries({ queryKey: ['pssr', pssrId, 'history'] });
  };
  return {
    upload: useMutation({ mutationFn: (values: Record<string, any>) => pssrAttachmentsService.upload(pssrId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: (attachmentId: string) => pssrAttachmentsService.delete(pssrId, attachmentId), onSuccess: invalidate }),
    preview: useMutation({ mutationFn: (attachmentId: string) => pssrAttachmentsService.preview(pssrId, attachmentId) }),
    download: useMutation({ mutationFn: (attachmentId: string) => pssrAttachmentsService.download(pssrId, attachmentId) }),
    linkDocument: useMutation({ mutationFn: (values: Record<string, any>) => pssrAttachmentsService.linkDocument(pssrId, values), onSuccess: invalidate })
  };
}
