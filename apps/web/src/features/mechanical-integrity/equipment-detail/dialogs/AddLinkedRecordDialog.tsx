'use client';

import { useState } from 'react';
import { DialogField, DialogShell } from './DialogShell';

export function AddLinkedRecordDialog({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (input: Record<string, unknown>) => void; saving?: boolean }) {
  const [moduleKey, setModuleKey] = useState('');
  const [recordId, setRecordId] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const disabled = !moduleKey || !recordId || saving;
  return (
    <DialogShell title="Add Linked Record" onClose={onClose}>
      <div className="space-y-4">
        <DialogField label="Module">
          <select className="psm-input w-full" value={moduleKey} onChange={(event) => setModuleKey(event.target.value)}>
            <option value="">Select module</option>
            {['moc','pssr','incident','hazop','lopa','ptw','loto','actions','documents','sds'].map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </select>
        </DialogField>
        <DialogField label="Record ID"><input className="psm-input w-full" value={recordId} onChange={(event) => setRecordId(event.target.value)} /></DialogField>
        <DialogField label="Safe display title"><input className="psm-input w-full" value={title} onChange={(event) => setTitle(event.target.value)} /></DialogField>
        <DialogField label="Deep link"><input className="psm-input w-full" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="/moc/..." /></DialogField>
        <button type="button" disabled={disabled} title={disabled ? 'Module and record ID are required.' : 'Link record'} onClick={() => onSubmit({ moduleKey, recordId, title: title || undefined, url: url || undefined })} className="psm-button w-full disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Linking...' : 'Link Record'}</button>
      </div>
    </DialogShell>
  );
}
