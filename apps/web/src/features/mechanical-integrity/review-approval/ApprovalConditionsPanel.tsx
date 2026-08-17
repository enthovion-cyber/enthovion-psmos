'use client';

import { useState } from 'react';
import { ApprovalStatusBadge } from '../shared/ApprovalStatusBadge';
import { ReviewButton, ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalCondition } from '../types/review-approval.types';

export function ApprovalConditionsPanel({ conditions, onAdd, disabled }: { conditions?: MiApprovalCondition[]; onAdd: (input: Record<string, unknown>) => void; disabled?: boolean }) {
  const [conditionText, setConditionText] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  return (
    <ReviewCard title="Approval Conditions" description="Conditions become tracked follow-up actions through the Universal Action Engine.">
      <form className="mb-4 grid gap-2 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); onAdd({ conditionText, ownerUserId, dueDate }); setConditionText(''); setOwnerUserId(''); setDueDate(''); }}>
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm md:col-span-3" value={conditionText} onChange={(event) => setConditionText(event.target.value)} placeholder="Condition text" />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={ownerUserId} onChange={(event) => setOwnerUserId(event.target.value)} placeholder="Owner user ID" />
        <input type="date" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        <ReviewButton type="submit" disabled={disabled || !conditionText.trim() || !ownerUserId.trim() || !dueDate} title={disabled ? 'Read-only approval.' : 'Condition, owner, and due date are required.'}>Add Condition</ReviewButton>
      </form>
      {!conditions?.length ? <EmptyPanel>No approval conditions recorded.</EmptyPanel> : <div className="space-y-2">{conditions.map((item) => <div key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex justify-between gap-3"><p className="font-semibold">{item.condition_text}</p><ApprovalStatusBadge status={item.status} /></div><p className="mt-1 text-xs text-[var(--psm-muted)]">Owner {item.owner_user_id ?? 'not assigned'} - due {item.due_date ?? 'not set'} - action {item.linked_action_id ?? 'not created'}</p></div>)}</div>}
    </ReviewCard>
  );
}
