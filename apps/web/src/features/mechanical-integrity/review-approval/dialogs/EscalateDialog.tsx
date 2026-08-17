'use client';

import { useState } from 'react';
import { DecisionDialogShell } from './DecisionDialogShell';

export function EscalateDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: Record<string, unknown>) => void }) {
  const [reason, setReason] = useState('');
  return (
    <DecisionDialogShell title="Escalate Approval" onClose={onClose} onSubmit={() => onSubmit({ reason })} submitLabel="Escalate">
      <textarea className="min-h-28 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Escalation reason is required" />
    </DecisionDialogShell>
  );
}
