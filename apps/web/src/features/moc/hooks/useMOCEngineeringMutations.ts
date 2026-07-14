'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EngineeringDocumentValues, EngineeringReviewValues } from '../schemas/moc-engineering.schema';
import { mocEngineeringService } from '../services/moc-engineering.service';

export function useMOCEngineeringMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'detail'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'engineering-package'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'closed-loop-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'closure-checklist'] }),
      queryClient.invalidateQueries({ queryKey: ['moc'] })
    ]);
  };
  return {
    upload: useMutation({ mutationFn: (values: EngineeringDocumentValues & { file?: File }) => mocEngineeringService.uploadDocument(id, values), onSuccess: refresh }),
    link: useMutation({ mutationFn: (values: EngineeringDocumentValues) => mocEngineeringService.linkDocument(id, values), onSuccess: refresh }),
    deleteDocument: useMutation({ mutationFn: (documentId: string) => mocEngineeringService.deleteDocument(id, documentId), onSuccess: refresh }),
    unlink: useMutation({ mutationFn: (documentId: string) => mocEngineeringService.unlinkDocument(id, documentId), onSuccess: refresh }),
    regenerateRequirements: useMutation({ mutationFn: () => mocEngineeringService.regenerateRequirements(id), onSuccess: refresh }),
    submitReview: useMutation({ mutationFn: () => mocEngineeringService.submitReview(id), onSuccess: refresh }),
    approve: useMutation({ mutationFn: (values: EngineeringReviewValues) => mocEngineeringService.approve(id, values), onSuccess: refresh }),
    reject: useMutation({ mutationFn: (values: EngineeringReviewValues) => mocEngineeringService.reject(id, values), onSuccess: refresh }),
    requestDocument: useMutation({ mutationFn: (values: EngineeringReviewValues) => mocEngineeringService.requestDocument(id, values), onSuccess: refresh })
  };
}
