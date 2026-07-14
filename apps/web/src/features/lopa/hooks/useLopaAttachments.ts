import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaAttachmentsService } from '../services/lopa-attachments.service';
import type { LopaAttachmentCommentInput, LopaAttachmentFilters, LopaAttachmentInput, LopaEvidenceMappingInput } from '../types/lopa-attachment.types';
export function useLopaAttachments(id: string, filters: LopaAttachmentFilters = {}) { return useQuery({ queryKey: ['lopa', 'attachments', id, filters], queryFn: () => lopaAttachmentsService.get(id, filters), enabled: !!id }); }
export function useLopaAttachmentMutations(id: string) { const client = useQueryClient(); const refresh = () => { void client.invalidateQueries({ queryKey: ['lopa', 'attachments', id] }); void client.invalidateQueries({ queryKey: ['lopa', 'history', id] }); void client.invalidateQueries({ queryKey: ['lopa', 'overview', id] }); void client.invalidateQueries({ queryKey: ['lopa', 'review-signoff', id] }); }; return {
  upload: useMutation({ mutationFn: ({ file, values }: { file: File; values: LopaAttachmentInput }) => lopaAttachmentsService.upload(id, file, values), onSuccess: refresh }),
  bulkUpload: useMutation({ mutationFn: ({ files, values }: { files: File[]; values: LopaAttachmentInput }) => lopaAttachmentsService.bulkUpload(id, files, values), onSuccess: refresh }),
  update: useMutation({ mutationFn: ({ attachmentId, values }: { attachmentId: string; values: LopaAttachmentInput }) => lopaAttachmentsService.update(id, attachmentId, values), onSuccess: refresh }),
  replace: useMutation({ mutationFn: ({ attachmentId, file, values }: { attachmentId: string; file: File; values: LopaAttachmentInput }) => lopaAttachmentsService.replace(id, attachmentId, file, values), onSuccess: refresh }),
  archive: useMutation({ mutationFn: ({ attachmentId, reason }: { attachmentId: string; reason?: string }) => lopaAttachmentsService.archive(id, attachmentId, reason), onSuccess: refresh }),
  restore: useMutation({ mutationFn: ({ attachmentId, reason }: { attachmentId: string; reason?: string }) => lopaAttachmentsService.restore(id, attachmentId, reason), onSuccess: refresh }),
  remove: useMutation({ mutationFn: ({ attachmentId, reason }: { attachmentId: string; reason?: string }) => lopaAttachmentsService.remove(id, attachmentId, reason), onSuccess: refresh }),
  addMapping: useMutation({ mutationFn: (values: LopaEvidenceMappingInput) => lopaAttachmentsService.addMapping(id, values), onSuccess: refresh }),
  updateMapping: useMutation({ mutationFn: ({ mappingId, values }: { mappingId: string; values: LopaEvidenceMappingInput }) => lopaAttachmentsService.updateMapping(id, mappingId, values), onSuccess: refresh }),
  removeMapping: useMutation({ mutationFn: ({ mappingId, reason }: { mappingId: string; reason?: string }) => lopaAttachmentsService.removeMapping(id, mappingId, reason), onSuccess: refresh }),
  linkDocument: useMutation({ mutationFn: (values: any) => lopaAttachmentsService.linkDocument(id, values), onSuccess: refresh }),
  unlinkDocument: useMutation({ mutationFn: ({ linkId, reason }: { linkId: string; reason?: string }) => lopaAttachmentsService.unlinkDocument(id, linkId, reason), onSuccess: refresh }),
  refreshDocument: useMutation({ mutationFn: (linkId: string) => lopaAttachmentsService.refreshDocument(id, linkId), onSuccess: refresh }),
  addComment: useMutation({ mutationFn: ({ attachmentId, values }: { attachmentId: string; values: LopaAttachmentCommentInput }) => lopaAttachmentsService.addComment(id, attachmentId, values), onSuccess: refresh }),
  updateComment: useMutation({ mutationFn: ({ attachmentId, commentId, values }: { attachmentId: string; commentId: string; values: LopaAttachmentCommentInput }) => lopaAttachmentsService.updateComment(id, attachmentId, commentId, values), onSuccess: refresh }),
  removeComment: useMutation({ mutationFn: ({ attachmentId, commentId, reason }: { attachmentId: string; commentId: string; reason?: string }) => lopaAttachmentsService.removeComment(id, attachmentId, commentId, reason), onSuccess: refresh }),
  bulkUpdate: useMutation({ mutationFn: (values: any) => lopaAttachmentsService.bulkUpdate(id, values), onSuccess: refresh })
}; }
