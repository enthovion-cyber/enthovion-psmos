'use client';

import { useState } from 'react';
import { Download, Eye, FileArchive, ImageIcon, Trash2, Upload } from 'lucide-react';
import type { EquipmentAttachment, UploadEquipmentAttachmentInput } from '@/services/equipment.service';

export function EquipmentAttachmentsPanel({
  attachments,
  onUpload,
  onDelete,
  onPreview,
  onDownload
}: {
  attachments: EquipmentAttachment[];
  onUpload: (input: UploadEquipmentAttachmentInput) => void;
  onDelete: (id: string) => void;
  onPreview: (attachment: EquipmentAttachment) => void;
  onDownload: (attachment: EquipmentAttachment) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [attachmentType, setAttachmentType] = useState('equipment-photo');
  return (
    <div className="psm-card p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Attachments ({attachments.length})</h2>
      <form onSubmit={(event) => { event.preventDefault(); if (file && title) { onUpload({ title, attachmentType, file }); setTitle(''); setFile(null); } }} className="mb-4 grid gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 md:grid-cols-4">
        <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Title *" className="psm-input px-3 text-sm" />
        <select value={attachmentType} onChange={(event) => setAttachmentType(event.target.value)} className="psm-input px-3 text-sm">
          {['equipment-photo', 'nameplate-photo', 'field-evidence', 'misc'].map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <input type="file" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="psm-input p-1 text-sm" />
        <button className="psm-button psm-button-primary"><Upload size={16} /> Upload Attachment</button>
      </form>
      {attachments.length === 0 ? (
        <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--psm-surface-3)] text-[var(--psm-muted)]"><FileArchive size={22} /></div>
            <div className="mt-3 font-semibold">No attachments uploaded</div>
            <p className="mt-2 max-w-md text-sm text-[var(--psm-muted)]">Upload field photos, nameplate images, evidence, or supporting files for this equipment.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
              <div className="mb-3 grid h-32 place-items-center overflow-hidden rounded-lg bg-[var(--psm-surface)] text-[var(--psm-muted)]">
                {attachment.mimeType.startsWith('image/') ? <ImageIcon size={28} /> : <FileArchive size={28} />}
              </div>
              <div className="font-medium">{attachment.title}</div>
              <div className="mt-1 truncate text-[var(--psm-muted)]">{attachment.attachmentType} · {attachment.fileName}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => onPreview(attachment)} className="psm-button psm-button-secondary min-h-8 px-2"><Eye size={15} /> Preview</button>
                <button onClick={() => onDownload(attachment)} className="psm-button psm-button-secondary min-h-8 px-2"><Download size={15} /> Download</button>
                <button onClick={() => onDelete(attachment.id)} className="psm-button psm-button-danger min-h-8 px-2"><Trash2 size={15} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
