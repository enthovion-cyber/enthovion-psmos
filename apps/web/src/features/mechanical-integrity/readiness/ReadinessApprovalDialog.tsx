'use client';

import { useState } from 'react';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function ReadinessApprovalDialog({ mode, onClose, onSubmit, saving }: { mode: 'approve' | 'reject' | 'override'; onClose: () => void; onSubmit: (input: Record<string, unknown>) => void; saving?: boolean }) {
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState('');
  const reasonRequired = mode !== 'approve';
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-xl">
        <h2 className="text-lg font-bold">{mode === 'approve' ? 'Approve Readiness' : mode === 'reject' ? 'Reject Readiness' : 'Override Readiness Decision'}</h2>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">This action is stored as an immutable readiness workflow event with audit/history metadata.</p>
        {mode !== 'reject' ? (
          <label className="mt-4 block text-sm font-semibold">Decision override
            <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={decision} onChange={(event) => setDecision(event.target.value)} placeholder="Leave blank to use proposed/recommended decision" />
          </label>
        ) : null}
        <label className="mt-4 block text-sm font-semibold">Comments / reason
          <textarea rows={4} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={comments} onChange={(event) => setComments(event.target.value)} />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <PrimaryButton disabled={saving || (reasonRequired && !comments.trim())} title={reasonRequired && !comments.trim() ? 'Reason is required.' : undefined} onClick={() => onSubmit({ comments, reason: comments, approvedDecision: decision || undefined, proposedDecision: decision || undefined })}>{saving ? 'Saving...' : 'Confirm'}</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
