'use client';

import { useState } from 'react';
import { AuditButton, AuditCard, Field, inputClass } from '../shared/AuditUi';

export function AuditRepeatFindingReviewPanel({ selected, onSubmit, saving }: { selected?: { id: string; action: string } | null; onSubmit: (reason: string) => void; saving?: boolean }) {
  const [reason, setReason] = useState('');
  return <AuditCard title="Repeat Finding Review" subtitle="Confirm, reject, recurring, and systemic decisions require a reason and create audit/history events."><Field label="Decision reason"><textarea className={inputClass()} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={selected ? `Reason for ${selected.action}` : 'Select a match action from the table.'} /></Field><div className="mt-3"><AuditButton disabled={!selected || !reason.trim() || saving} title={!selected ? 'Select a repeat match first' : !reason.trim() ? 'Reason is required' : 'Submit repeat finding review'} onClick={() => onSubmit(reason)}>{saving ? 'Saving...' : 'Submit Review'}</AuditButton></div></AuditCard>;
}
