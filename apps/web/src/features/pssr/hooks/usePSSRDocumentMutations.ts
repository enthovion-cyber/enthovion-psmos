import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrDocumentReadinessService } from '../services/pssr-document-readiness.service';

export function usePSSRDocumentMutations(pssrId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['pssr', pssrId] });
  return {
    generate: useMutation({ mutationFn: () => pssrDocumentReadinessService.generate(pssrId), onSuccess: invalidate }),
    syncFromMoc: useMutation({ mutationFn: () => pssrDocumentReadinessService.syncFromMoc(pssrId), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: (values: Record<string, any>) => pssrDocumentReadinessService.linkDocument(pssrId, values), onSuccess: invalidate }),
    unlinkDocument: useMutation({ mutationFn: (readinessId: string) => pssrDocumentReadinessService.unlinkDocument(pssrId, readinessId), onSuccess: invalidate }),
    requestRevision: useMutation({ mutationFn: ({ readinessId, reason }: { readinessId: string; reason: string }) => pssrDocumentReadinessService.requestRevision(pssrId, readinessId, reason), onSuccess: invalidate }),
    justifyNotRequired: useMutation({ mutationFn: ({ readinessId, justification }: { readinessId: string; justification: string }) => pssrDocumentReadinessService.justifyNotRequired(pssrId, readinessId, justification), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: ({ readinessId, comment }: { readinessId: string; comment: string }) => pssrDocumentReadinessService.verify(pssrId, readinessId, comment), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: ({ readinessId, reason }: { readinessId: string; reason: string }) => pssrDocumentReadinessService.reject(pssrId, readinessId, reason), onSuccess: invalidate })
  };
}
