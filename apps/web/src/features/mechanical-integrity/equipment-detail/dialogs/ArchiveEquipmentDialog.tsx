'use client';

import { useState } from 'react';
import { DialogField, DialogShell } from './DialogShell';

export function ArchiveEquipmentDialog({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (reason: string) => void; saving?: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <DialogShell title="Archive Equipment" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--psm-muted)]">Archive requires a reason. Backend blocks archive when active bypass, startup blocker, or critical deficiency is open.</p>
        <DialogField label="Archive reason">
          <textarea className="psm-input min-h-28 w-full" value={reason} onChange={(event) => setReason(event.target.value)} />
        </DialogField>
        <button type="button" disabled={!reason.trim() || saving} title={!reason.trim() ? 'Archive reason is required.' : 'Archive equipment'} onClick={() => onSubmit(reason)} className="psm-button w-full disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Archiving...' : 'Archive Equipment'}</button>
      </div>
    </DialogShell>
  );
}
