'use client';

import { useState } from 'react';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function DocumentWaiverDialog({ requirementId, onClose, onSubmit, saving }: { requirementId: string; onClose: () => void; onSubmit: (input: Record<string, unknown>) => void; saving?: boolean }) {
  const [reason, setReason] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><section className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-xl"><h2 className="text-lg font-bold">Request Document Waiver</h2><p className="mt-1 text-sm text-[var(--psm-muted)]">Waiver requires reason and backend approval before missing evidence is accepted.</p><label className="mt-4 block text-sm font-semibold">Waiver reason<textarea rows={4} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={reason} onChange={(event) => setReason(event.target.value)} /></label><label className="mt-3 block text-sm font-semibold">Expiry date<input type="date" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} /></label><div className="mt-5 flex justify-end gap-2"><ActionButton onClick={onClose}>Cancel</ActionButton><PrimaryButton disabled={saving || !reason.trim()} title={!reason.trim() ? 'Waiver reason is required.' : undefined} onClick={() => onSubmit({ requirementId, reason, expiryDate })}>{saving ? 'Saving...' : 'Request Waiver'}</PrimaryButton></div></section></div>;
}
