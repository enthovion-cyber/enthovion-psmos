'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsService, type DocumentUploadInput } from '@/services/documents.service';

export function useDocuments(params?: Record<string, string>) {
  return useQuery({ queryKey: ['documents', params], queryFn: () => documentsService.list(params) });
}
export function useDocument(id: string) {
  return useQuery({ queryKey: ['documents', id], queryFn: () => documentsService.get(id), enabled: Boolean(id) });
}
export function useDocumentFolders() {
  return useQuery({ queryKey: ['documents', 'folders'], queryFn: () => documentsService.folders() });
}
export function useDocumentReviewDue() {
  return useQuery({ queryKey: ['documents', 'review-due'], queryFn: () => documentsService.reviewDue() });
}
export function useDocumentOverdueReviews() {
  return useQuery({ queryKey: ['documents', 'overdue'], queryFn: () => documentsService.overdueReviews() });
}
export function useDocumentMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
      id ? queryClient.invalidateQueries({ queryKey: ['documents', id] }) : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    ]);
  };
  return {
    upload: useMutation({ mutationFn: (input: DocumentUploadInput) => documentsService.upload(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Partial<DocumentUploadInput>) => documentsService.update(id!, input), onSuccess: invalidate }),
    uploadVersion: useMutation({ mutationFn: (input: { file: File; changeSummary: string }) => documentsService.uploadVersion(id!, input), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: () => documentsService.submitReview(id!), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (comment?: string) => documentsService.approve(id!, comment), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (comment: string) => documentsService.reject(id!, comment), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: () => documentsService.activate(id!), onSuccess: invalidate }),
    obsolete: useMutation({ mutationFn: (reason: string) => documentsService.obsolete(id!, reason), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (reason: string) => documentsService.archive(id!, reason), onSuccess: invalidate }),
    addRelation: useMutation({ mutationFn: (input: { relatedModule: string; relatedRecordId: string; equipmentId?: string; relationType?: string }) => documentsService.addRelation(id!, input), onSuccess: invalidate }),
    addComment: useMutation({ mutationFn: (body: string) => documentsService.addComment(id!, body), onSuccess: invalidate })
  };
}
