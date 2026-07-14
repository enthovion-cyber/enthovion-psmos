import { api } from '@/services/api';
import type { LopaReviewCommentInput, LopaReviewDecisionInput, LopaReviewParticipantInput, LopaReviewSignatureInput, LopaReviewSignoffData } from '../types/lopa-review-signoff.types';

function unwrap<T>(response: { data: { data: T } }) { return response.data.data; }

export const lopaReviewSignoffService = {
  get: (id: string) => api.get(`/lopa/${id}/review-signoff`).then(unwrap<LopaReviewSignoffData>),
  refreshReadiness: (id: string) => api.post(`/lopa/${id}/review-signoff/refresh-readiness`).then(unwrap<LopaReviewSignoffData>),
  submit: (id: string, input: LopaReviewDecisionInput) => api.post(`/lopa/${id}/review-signoff/submit`, input).then(unwrap<any>),
  withdraw: (id: string, input: LopaReviewDecisionInput) => api.post(`/lopa/${id}/review-signoff/withdraw`, input).then(unwrap<any>),
  requestChanges: (id: string, input: LopaReviewDecisionInput) => api.post(`/lopa/${id}/review-signoff/request-changes`, input).then(unwrap<any>),
  approve: (id: string, input: LopaReviewDecisionInput) => api.post(`/lopa/${id}/review-signoff/approve`, input).then(unwrap<any>),
  reject: (id: string, input: LopaReviewDecisionInput) => api.post(`/lopa/${id}/review-signoff/reject`, input).then(unwrap<any>),
  reopen: (id: string, input: LopaReviewDecisionInput) => api.post(`/lopa/${id}/review-signoff/reopen`, input).then(unwrap<any>),
  addParticipant: (id: string, input: LopaReviewParticipantInput) => api.post(`/lopa/${id}/review-signoff/participants`, input).then(unwrap<any>),
  updateParticipant: (id: string, participantId: string, input: LopaReviewParticipantInput) => api.patch(`/lopa/${id}/review-signoff/participants/${participantId}`, input).then(unwrap<any>),
  removeParticipant: (id: string, participantId: string, reason: string) => api.delete(`/lopa/${id}/review-signoff/participants/${participantId}`, { data: { reason } }).then(unwrap<any>),
  decideParticipant: (id: string, participantId: string, input: LopaReviewDecisionInput) => api.post(`/lopa/${id}/review-signoff/participants/${participantId}/decision`, input).then(unwrap<any>),
  remindParticipant: (id: string, participantId: string, message?: string) => api.post(`/lopa/${id}/review-signoff/participants/${participantId}/send-reminder`, { ...(message ? { message } : {}) }).then(unwrap<any>),
  addComment: (id: string, input: LopaReviewCommentInput) => api.post(`/lopa/${id}/review-signoff/comments`, input).then(unwrap<any>),
  updateComment: (id: string, commentId: string, input: LopaReviewCommentInput) => api.patch(`/lopa/${id}/review-signoff/comments/${commentId}`, input).then(unwrap<any>),
  resolveComment: (id: string, commentId: string, reason: string) => api.post(`/lopa/${id}/review-signoff/comments/${commentId}/resolve`, { reason }).then(unwrap<any>),
  reopenComment: (id: string, commentId: string, reason: string) => api.post(`/lopa/${id}/review-signoff/comments/${commentId}/reopen`, { reason }).then(unwrap<any>),
  commentThread: (id: string, commentId: string) => api.get(`/lopa/${id}/review-signoff/comments/${commentId}/thread`).then(unwrap<any[]>),
  addCommentThread: (id: string, commentId: string, message: string) => api.post(`/lopa/${id}/review-signoff/comments/${commentId}/thread`, { message }).then(unwrap<any>),
  requestSignature: (id: string, participantId: string) => api.post(`/lopa/${id}/review-signoff/signatures/request`, { participantId }).then(unwrap<any>),
  sign: (id: string, input: LopaReviewSignatureInput) => api.post(`/lopa/${id}/review-signoff/signatures/sign`, input).then(unwrap<any>),
  acceptException: (id: string, blockerId: string, reason: string) => api.post(`/lopa/${id}/review-signoff/blockers/${blockerId}/accept-exception`, { reason }).then(unwrap<any>),
  sendReminders: (id: string, message?: string) => api.post(`/lopa/${id}/review-signoff/send-reminders`, { ...(message ? { message } : {}) }).then(unwrap<any>)
};
