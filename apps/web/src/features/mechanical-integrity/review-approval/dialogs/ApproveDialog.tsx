'use client';

import { useState } from 'react';
import { DecisionDialogShell } from './DecisionDialogShell';

export function ApproveDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: Record<string, unknown>) => void }) {
  const [comment, setComment] = useState('');
  return (
    <DecisionDialogShell title="Approve MI Record" onClose={onClose} onSubmit={() => onSubmit({ comment, signatureMeaning: 'Approved' })} submitLabel="Approve">
      <textarea className="min-h-28 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Approval comment or signature statement" />
    </DecisionDialogShell>
  );
}
