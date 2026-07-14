import { useState } from 'react';
import type { HazopReviewComment } from '../../types/hazop-review.types';
import { Button } from './HazopApprovalWorkflowPanel';
import { Panel } from './HazopReadinessChecklist';

export function HazopReviewCommentsPanel({ comments, canAdd = true, canResolve = true, loading, onAdd, onResolve, onCreateAction }: { comments: HazopReviewComment[]; canAdd?: boolean; canResolve?: boolean; loading?: boolean; onAdd: (values: Record<string, any>) => void; onResolve: (comment: HazopReviewComment) => void; onCreateAction: (comment: HazopReviewComment) => void }) {
  const [text, setText] = useState('');
  const [commentType, setCommentType] = useState('General');
  const [severity, setSeverity] = useState('Info');
  const [requiresResolution, setRequiresResolution] = useState(false);
  return (
    <Panel title="Review Comments / Return-for-Rework">
      {canAdd ? (
        <div className="mb-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
          <div className="grid gap-2 md:grid-cols-3">
            <select className="input" value={commentType} onChange={(event) => setCommentType(event.target.value)}>
              {['General', 'Required Change', 'Risk Concern', 'Missing Evidence', 'Recommendation Issue', 'Safeguard Concern', 'Document Issue', 'Approval Condition'].map((option) => <option key={option}>{option}</option>)}
            </select>
            <select className="input" value={severity} onChange={(event) => setSeverity(event.target.value)}>
              {['Info', 'Low', 'Medium', 'High', 'Critical'].map((option) => <option key={option}>{option}</option>)}
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 text-sm text-[var(--psm-muted)]"><input type="checkbox" checked={requiresResolution} onChange={(event) => setRequiresResolution(event.target.checked)} /> Required change</label>
          </div>
          <textarea className="input mt-2 min-h-24 w-full" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add review comment, required change, rework note, or approval condition..." />
          <div className="mt-2 flex justify-end">
            <Button disabled={loading || !text.trim()} onClick={() => { if (text.trim()) { onAdd({ comment: text, commentType, severity, requiresResolution }); setText(''); setRequiresResolution(false); } }}>Add Comment</Button>
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className={`rounded-lg border p-3 text-sm ${comment.requires_resolution && comment.status !== 'Resolved' ? 'border-amber-500/30 bg-amber-500/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}>
            <div className="flex justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 font-semibold">
                  <span>{comment.comment_type ?? 'Comment'}</span>
                  <Badge value={comment.status ?? 'Open'} />
                  {comment.requires_resolution ? <Badge value="Blocks approval" tone="amber" /> : null}
                </div>
                <p className="mt-2 text-[var(--psm-muted)]">{comment.comment_text}</p>
                <p className="mt-2 text-xs text-[var(--psm-muted)]">{comment.author?.displayName ?? 'Unknown'} · {comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 text-right">
                {canResolve && comment.status !== 'Resolved' ? <button disabled={loading} onClick={() => onResolve(comment)} className="text-xs text-emerald-300 disabled:opacity-40">Resolve</button> : null}
                {comment.status !== 'Resolved' ? <button disabled={loading} onClick={() => onCreateAction(comment)} className="text-xs text-primary disabled:opacity-40">Create Action</button> : null}
              </div>
            </div>
          </div>
        ))}
        {!comments.length ? <p className="text-sm text-[var(--psm-muted)]">No review comments recorded.</p> : null}
      </div>
    </Panel>
  );
}

function Badge({ value, tone }: { value: string; tone?: 'amber' }) {
  const color = tone === 'amber' ? 'border-amber-400/30 bg-amber-500/15 text-amber-200' : value === 'Resolved' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200' : 'border-blue-400/30 bg-blue-500/15 text-blue-200';
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] ${color}`}>{value}</span>;
}
