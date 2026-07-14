import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AttachmentRequirementValues, AttachmentUploadValues, LinkDocumentValues } from '../schemas/attachment.schema';
import { ptwAttachmentService } from '../services/ptw-attachment.service';

export function usePermitAttachmentMutations(permitId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ptw'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'attachments'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'history'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', 'attachment-requirements'] })
  ]);
  return {
    upload: useMutation({ mutationFn: ({ file, input }: { file: File; input: AttachmentUploadValues }) => ptwAttachmentService.upload(permitId, file, input), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: (attachmentId: string) => ptwAttachmentService.delete(permitId, attachmentId), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (input: LinkDocumentValues) => ptwAttachmentService.linkDocument(permitId, input), onSuccess: invalidate }),
    unlinkDocument: useMutation({ mutationFn: (documentId: string) => ptwAttachmentService.unlinkDocument(permitId, documentId), onSuccess: invalidate }),
    createRequirement: useMutation({ mutationFn: (input: AttachmentRequirementValues) => ptwAttachmentService.createRequirement(input), onSuccess: invalidate }),
    updateRequirement: useMutation({ mutationFn: ({ id, input }: { id: string; input: AttachmentRequirementValues }) => ptwAttachmentService.updateRequirement(id, input), onSuccess: invalidate }),
    deleteRequirement: useMutation({ mutationFn: (id: string) => ptwAttachmentService.deleteRequirement(id), onSuccess: invalidate })
  };
}
