'use client';

import { useState } from 'react';
import { DecisionDialogShell } from './DecisionDialogShell';

export function DelegateDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: Record<string, unknown>) => void }) {
  const [delegateToUserId, setDelegateToUserId] = useState('');
  const [reason, setReason] = useState('');
  return (
    <DecisionDialogShell title="Delegate Approval" onClose={onClose} onSubmit={() => onSubmit({ delegateToUserId, reason })} submitLabel="Delegate">
      <div className="grid gap-3">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={delegateToUserId} onChange={(event) => setDelegateToUserId(event.target.value)} placeholder="Delegate to user ID" />
        <textarea className="min-h-24 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Delegation reason is required" />
      </div>
    </DecisionDialogShell>
  );
}
