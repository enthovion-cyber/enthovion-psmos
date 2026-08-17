'use client';

import { useState } from 'react';
import { DialogField, DialogShell } from './DialogShell';

export function ChangeEquipmentStatusDialog({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (input: { status: string; reason: string }) => void; saving?: boolean }) {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const disabled = !status || !reason.trim() || saving;
  return (
    <DialogShell title="Change Equipment Status" onClose={onClose}>
      <div className="space-y-4">
        <DialogField label="New status">
          <select className="psm-input w-full" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Select status</option>
            {['Active','In Service','Standby','Out of Service','Under Maintenance','Under Inspection','Impaired','Bypassed','Restricted Service','Not Fit for Service','Startup Blocked','Decommissioned'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </DialogField>
        <DialogField label="Reason">
          <textarea className="psm-input min-h-28 w-full" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for status and safety-critical traceability" />
        </DialogField>
        <button type="button" disabled={disabled} title={disabled ? 'Status and reason are required.' : 'Save status change'} onClick={() => onSubmit({ status, reason })} className="psm-button w-full disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving...' : 'Save Status Change'}</button>
      </div>
    </DialogShell>
  );
}
