'use client';

import { useState } from 'react';
import { DialogField, DialogShell } from './DialogShell';

export function ReactivateEquipmentDialog({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (reason: string) => void; saving?: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <DialogShell title="Reactivate Equipment" onClose={onClose}>
      <div className="space-y-4">
        <DialogField label="Reactivation reason">
          <textarea className="psm-input min-h-28 w-full" value={reason} onChange={(event) => setReason(event.target.value)} />
        </DialogField>
        <button type="button" disabled={!reason.trim() || saving} title={!reason.trim() ? 'Reactivation reason is required.' : 'Reactivate equipment'} onClick={() => onSubmit(reason)} className="psm-button w-full disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Reactivating...' : 'Reactivate Equipment'}</button>
      </div>
    </DialogShell>
  );
}
