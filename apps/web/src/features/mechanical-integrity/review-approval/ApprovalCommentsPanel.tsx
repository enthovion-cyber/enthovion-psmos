'use client';

import { useState } from 'react';
import { ReviewButton, ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalComment } from '../types/review-approval.types';

export function ApprovalCommentsPanel({ comments, onAdd, disabled }: { comments?: MiApprovalComment[]; onAdd: (input: Record<string, unknown>) => void; disabled?: boolean }) {
  const [comment, setComment] = useState('');
  return (
    <ReviewCard title="Review Comments" description="Reviewer comments, internal notes, requests for information, and required action comments.">
      <form className="mb-4 grid gap-2" onSubmit={(event) => { event.preventDefault(); if (comment.trim()) { onAdd({ commentText: comment, commentType: 'General Comment' }); setComment(''); } }}>
        <textarea className="min-h-24 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add approval comment" />
        <ReviewButton type="submit" disabled={disabled || !comment.trim()} title={disabled ? 'Completed approvals are read-only.' : 'Comment is required.'}>Add Comment</ReviewButton>
      </form>
      {!comments?.length ? <EmptyPanel>No comments yet.</EmptyPanel> : <div className="space-y-2">{comments.map((item) => <div key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-sm">{item.comment_text}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{item.comment_type} by {item.created_by} at {new Date(item.created_at).toLocaleString()}</p></div>)}</div>}
    </ReviewCard>
  );
}
