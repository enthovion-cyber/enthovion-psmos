'use client';
import { useState } from 'react';
import { TrainingButton, TrainingCard } from '../shared/TrainingUi';
import { useTrainingApprovalMutations } from '../hooks/useTrainingApprovalMutations';
export function TrainingApprovalCommentPanel({ approvalId, comments }: { approvalId: string; comments?: any[] | undefined }) {
  const [comment, setComment] = useState('');
  const mutations = useTrainingApprovalMutations(approvalId);
  return <TrainingCard title="Comments" subtitle="Review comments, correction notes, and decision context."><textarea className="mb-2 min-h-20 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add review comment" /><TrainingButton disabled={!comment.trim() || mutations.comment.isPending} title={!comment.trim() ? 'Comment text is required.' : ''} onClick={() => mutations.comment.mutate({ commentText: comment }, { onSuccess: () => setComment('') })}>Add Comment</TrainingButton><div className="mt-4 space-y-2">{comments?.length ? comments.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p>{row.comment_text}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.comment_type} / {row.created_by} / {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</p></div>) : <p className="text-sm text-[var(--psm-muted)]">No comments yet.</p>}</div></TrainingCard>;
}
