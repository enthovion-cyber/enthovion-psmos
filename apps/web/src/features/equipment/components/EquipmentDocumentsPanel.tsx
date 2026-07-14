'use client';

import { useState } from 'react';
import { Download, Eye, FilePlus2, RefreshCw, Trash2 } from 'lucide-react';
import type { EquipmentDocument, UploadEquipmentDocumentInput } from '@/services/equipment.service';

export function EquipmentDocumentsPanel({
  documents,
  onUpload,
  onReplace,
  onDelete,
  onPreview,
  onDownload
}: {
  documents: EquipmentDocument[];
  onUpload: (input: UploadEquipmentDocumentInput) => void;
  onReplace: (documentId: string, input: UploadEquipmentDocumentInput) => void;
  onDelete: (documentId: string) => void;
  onPreview: (document: EquipmentDocument) => void;
  onDownload: (document: EquipmentDocument) => void;
}) {
  const [replaceId, setReplaceId] = useState<string | null>(null);
  return (
    <div className="psm-card p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Controlled Documents ({documents.length})</h2>
        <DocumentUploadButton label="Upload" onSubmit={onUpload} />
      </div>
      {documents.length === 0 ? <Empty title="No controlled documents linked" description="Upload a P&ID, datasheet, certificate, SOP, or vendor file to begin document control for this asset." /> : (
        <div className="overflow-auto rounded-lg border border-[var(--psm-line)]">
          <table className="psm-table w-full min-w-[760px] text-sm">
            <thead className="text-left text-[var(--psm-muted)]">
              <tr><th className="p-3">Title</th><th>Type</th><th>File</th><th>Uploaded</th><th className="text-right pr-3">Actions</th></tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                  <td className="p-3 font-medium">{doc.title}</td>
                  <td>{doc.documentType}</td>
                  <td className="text-[var(--psm-muted)]">{doc.fileName}</td>
                  <td className="text-[var(--psm-muted)]">{new Date(doc.uploadedAt).toLocaleString()}</td>
                  <td className="pr-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onPreview(doc)} className="psm-button psm-button-ghost min-h-8 px-2" aria-label={`Preview ${doc.title}`}><Eye size={15} /></button>
                      <button onClick={() => onDownload(doc)} className="psm-button psm-button-ghost min-h-8 px-2" aria-label={`Download ${doc.title}`}><Download size={15} /></button>
                      <button onClick={() => setReplaceId(replaceId === doc.id ? null : doc.id)} className="psm-button psm-button-ghost min-h-8 px-2" aria-label={`Replace ${doc.title}`}><RefreshCw size={15} /></button>
                      <button onClick={() => onDelete(doc.id)} className="psm-button psm-button-ghost min-h-8 px-2 text-danger" aria-label={`Delete ${doc.title}`}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {replaceId ? <div className="mt-4"><DocumentUploadButton label="Replace Selected Document" onSubmit={(input) => onReplace(replaceId, input)} expanded /></div> : null}
    </div>
  );
}

function DocumentUploadButton({ label, onSubmit, expanded = false }: { label: string; onSubmit: (input: UploadEquipmentDocumentInput) => void; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('Datasheet');
  if (!open) return <button onClick={() => setOpen(true)} className="psm-button psm-button-primary"><FilePlus2 size={16} /> {label}</button>;
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (file && title) { onSubmit({ title, documentType, file }); setOpen(false); } }} className="grid gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 md:grid-cols-4">
      <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Title *" className="psm-input px-3 text-sm" />
      <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="psm-input px-3 text-sm">
        {['P&ID', 'Datasheet', 'Vendor Manual', 'SOP', 'Certificate', 'Inspection Report', 'Other'].map((type) => <option key={type}>{type}</option>)}
      </select>
      <input type="file" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="psm-input p-1 text-sm" />
      <button className="psm-button psm-button-primary">{label}</button>
    </form>
  );
}

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--psm-surface-3)] text-[var(--psm-muted)]"><FilePlus2 size={22} /></div>
        <div className="mt-3 font-semibold">{title}</div>
        <p className="mt-2 max-w-md text-sm text-[var(--psm-muted)]">{description}</p>
      </div>
    </div>
  );
}
