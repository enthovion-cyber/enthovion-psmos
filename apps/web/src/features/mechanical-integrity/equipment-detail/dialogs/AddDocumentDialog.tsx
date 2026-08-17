'use client';

import { useState } from 'react';
import { DialogField, DialogShell } from './DialogShell';

export function AddDocumentDialog({ onClose, onSubmit, saving }: { onClose: () => void; onSubmit: (input: { title: string; documentType: string; documentNo?: string; file?: File }) => void; saving?: boolean }) {
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentNo, setDocumentNo] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const disabled = !title || !documentType || saving;
  return (
    <DialogShell title="Add Document / Certificate" onClose={onClose}>
      <div className="space-y-4">
        <DialogField label="Title"><input className="psm-input w-full" value={title} onChange={(event) => setTitle(event.target.value)} /></DialogField>
        <DialogField label="Document type">
          <select className="psm-input w-full" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
            <option value="">Select type</option>
            {['Datasheet','Manual','P&ID','Drawing','Inspection report','Calibration certificate','PSV certificate','NDT report','Hydrotest certificate','Vendor certificate','Maintenance procedure','SOP','Photos'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </DialogField>
        <DialogField label="Document number"><input className="psm-input w-full" value={documentNo} onChange={(event) => setDocumentNo(event.target.value)} /></DialogField>
        <DialogField label="File"><input className="psm-input w-full" type="file" onChange={(event) => setFile(event.target.files?.[0])} /></DialogField>
        <button
          type="button"
          disabled={disabled}
          title={disabled ? 'Title and document type are required.' : 'Add document'}
          onClick={() => {
            const input: { title: string; documentType: string; documentNo?: string; file?: File } = { title, documentType };
            if (documentNo) input.documentNo = documentNo;
            if (file) input.file = file;
            onSubmit(input);
          }}
          className="psm-button w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add Document'}
        </button>
      </div>
    </DialogShell>
  );
}
