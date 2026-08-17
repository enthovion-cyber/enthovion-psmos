'use client';

import { useState } from 'react';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function DeviationExtensionDialog({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (input: Record<string, unknown>) => void; saving?: boolean }) {
  const [expiryDate, setExpiryDate] = useState('');
  const [reason, setReason] = useState('');
  const disabledReason = !expiryDate ? 'New expiry date is required.' : !reason ? 'Extension reason is required.' : '';
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-xl">
        <h2 className="text-lg font-bold">Request Deviation Extension</h2>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Extension requires reason and approval. Expiry is enforced by the backend.</p>
        <label className="mt-4 block text-sm font-semibold">New expiry date
          <input type="date" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
        </label>
        <label className="mt-4 block text-sm font-semibold">Reason
          <textarea rows={3} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <PrimaryButton disabled={Boolean(disabledReason) || saving} title={disabledReason} onClick={() => onSubmit({ expiryDate, reason })}>{saving ? 'Saving...' : 'Request Extension'}</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
