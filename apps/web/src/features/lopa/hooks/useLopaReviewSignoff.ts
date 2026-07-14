import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaReviewSignoffService } from '../services/lopa-review-signoff.service';
import type { LopaReviewCommentInput, LopaReviewDecisionInput, LopaReviewParticipantInput, LopaReviewSignatureInput } from '../types/lopa-review-signoff.types';

export function useLopaReviewSignoff(id: string) {
  return useQuery({ queryKey: ['lopa', 'review-signoff', id], queryFn: () => lopaReviewSignoffService.get(id), enabled: !!id, refetchOnMount: 'always' });
}

export function useLopaReviewMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = () => ['review-signoff', 'overview', 'detail', 'team-sessions', 'recommendations', 'linked-records', 'risk-calculation'].forEach((key) => void queryClient.invalidateQueries({ queryKey: ['lopa', key, id] }));
  return {
    refreshReadiness: useMutation({ mutationFn: () => lopaReviewSignoffService.refreshReadiness(id), onSuccess: refresh }),
    submit: useMutation({ mutationFn: (input: LopaReviewDecisionInput) => lopaReviewSignoffService.submit(id, input), onSuccess: refresh }),
    withdraw: useMutation({ mutationFn: (input: LopaReviewDecisionInput) => lopaReviewSignoffService.withdraw(id, input), onSuccess: refresh }),
    requestChanges: useMutation({ mutationFn: (input: LopaReviewDecisionInput) => lopaReviewSignoffService.requestChanges(id, input), onSuccess: refresh }),
    approve: useMutation({ mutationFn: (input: LopaReviewDecisionInput) => lopaReviewSignoffService.approve(id, input), onSuccess: refresh }),
    reject: useMutation({ mutationFn: (input: LopaReviewDecisionInput) => lopaReviewSignoffService.reject(id, input), onSuccess: refresh }),
    reopen: useMutation({ mutationFn: (input: LopaReviewDecisionInput) => lopaReviewSignoffService.reopen(id, input), onSuccess: refresh }),
    addParticipant: useMutation({ mutationFn: (input: LopaReviewParticipantInput) => lopaReviewSignoffService.addParticipant(id, input), onSuccess: refresh }),
    updateParticipant: useMutation({ mutationFn: ({ participantId, input }: { participantId: string; input: LopaReviewParticipantInput }) => lopaReviewSignoffService.updateParticipant(id, participantId, input), onSuccess: refresh }),
    removeParticipant: useMutation({ mutationFn: ({ participantId, reason }: { participantId: string; reason: string }) => lopaReviewSignoffService.removeParticipant(id, participantId, reason), onSuccess: refresh }),
    decideParticipant: useMutation({ mutationFn: ({ participantId, input }: { participantId: string; input: LopaReviewDecisionInput }) => lopaReviewSignoffService.decideParticipant(id, participantId, input), onSuccess: refresh }),
    remindParticipant: useMutation({ mutationFn: ({ participantId, message }: { participantId: string; message?: string }) => lopaReviewSignoffService.remindParticipant(id, participantId, message), onSuccess: refresh }),
    addComment: useMutation({ mutationFn: (input: LopaReviewCommentInput) => lopaReviewSignoffService.addComment(id, input), onSuccess: refresh }),
    updateComment: useMutation({ mutationFn: ({ commentId, input }: { commentId: string; input: LopaReviewCommentInput }) => lopaReviewSignoffService.updateComment(id, commentId, input), onSuccess: refresh }),
    resolveComment: useMutation({ mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) => lopaReviewSignoffService.resolveComment(id, commentId, reason), onSuccess: refresh }),
    reopenComment: useMutation({ mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) => lopaReviewSignoffService.reopenComment(id, commentId, reason), onSuccess: refresh }),
    requestSignature: useMutation({ mutationFn: (participantId: string) => lopaReviewSignoffService.requestSignature(id, participantId), onSuccess: refresh }),
    sign: useMutation({ mutationFn: (input: LopaReviewSignatureInput) => lopaReviewSignoffService.sign(id, input), onSuccess: refresh }),
    acceptException: useMutation({ mutationFn: ({ blockerId, reason }: { blockerId: string; reason: string }) => lopaReviewSignoffService.acceptException(id, blockerId, reason), onSuccess: refresh }),
    sendReminders: useMutation({ mutationFn: (message?: string) => lopaReviewSignoffService.sendReminders(id, message), onSuccess: refresh })
  };
}
