'use client';

import { useState } from 'react';
import { 
  Download, 
  Eye, 
  FileArchive, 
  ImageIcon, 
  Trash2, 
  Upload, 
  X,
  FileCheck,
  Calendar
} from 'lucide-react';
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
  const [previewAttachmentItem, setPreviewAttachmentItem] = useState<EquipmentAttachment | null>(null);

  return (
    <div className="space-y-4 psm-fade-in">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--psm-text)]">Equipment Photos & Field Attachments</h2>
            <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
              Nameplate photos, field condition pictures, NDT radiographic images, and vendor certificates.
            </p>
          </div>
          <span className="psm-badge psm-badge-primary text-xs">{attachments.length}</span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (file && title) {
              onUpload({ title, attachmentType, file });
              setTitle('');
              setFile(null);
            }
          }}
          className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 md:grid-cols-4"
        >
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="Attachment Title *"
            className="psm-input px-3 text-xs"
          />
          <select
            value={attachmentType}
            onChange={(event) => setAttachmentType(event.target.value)}
            className="psm-input px-3 text-xs"
          >
            {[
              { id: 'equipment-photo', label: 'Equipment Overview Photo' },
              { id: 'nameplate-photo', label: 'Nameplate Stamp Photo' },
              { id: 'field-evidence', label: 'Field Evidence / Defect' },
              { id: 'calibration-sheet', label: 'Calibration Data Sheet' },
              { id: 'misc', label: 'Miscellaneous' }
            ].map((type) => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          <input
            type="file"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="psm-input p-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-[var(--psm-surface-3)] file:px-2 file:py-1 file:text-xs file:text-[var(--psm-text)]"
          />
          <button type="submit" className="psm-button psm-button-primary text-xs font-semibold">
            <Upload size={14} /> Upload Attachment
          </button>
        </form>
      </div>

      {attachments.length === 0 ? (
        <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileArchive size={22} />
            </div>
            <div className="mt-3 font-bold text-sm text-[var(--psm-text)]">No attachments uploaded yet</div>
            <p className="mt-1 max-w-md text-xs text-[var(--psm-muted)]">
              Upload field photos, nameplate images, inspection evidence, or calibration files for this equipment.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm hover:border-primary/40 transition"
            >
              <div className="mb-3 grid h-36 place-items-center overflow-hidden rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]">
                {attachment.mimeType.startsWith('image/') ? (
                  <ImageIcon size={32} className="text-primary/70" />
                ) : (
                  <FileArchive size={32} className="text-info/70" />
                )}
              </div>

              <div className="font-bold text-sm text-[var(--psm-text)] truncate">{attachment.title}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-[var(--psm-muted)]">
                <span className="font-medium text-primary capitalize">{attachment.attachmentType.replace(/-/g, ' ')}</span>
                <span className="truncate max-w-[120px] font-mono">{attachment.fileName}</span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[var(--psm-line)] pt-3 text-xs">
                <span className="text-[11px] text-[var(--psm-muted)]">
                  {new Date(attachment.uploadedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewAttachmentItem(attachment);
                      onPreview(attachment);
                    }}
                    className="psm-button psm-button-secondary text-xs py-1 px-2"
                  >
                    <Eye size={13} /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownload(attachment)}
                    className="psm-button psm-button-secondary text-xs py-1 px-2"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(attachment.id)}
                    className="psm-button psm-button-ghost text-xs text-danger py-1 px-2"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachmentItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/75 p-3 backdrop-blur-md sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl psm-fade-in">
            <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
              <div>
                <h3 className="text-base font-bold text-[var(--psm-text)]">{previewAttachmentItem.title}</h3>
                <p className="text-xs text-[var(--psm-muted)] font-mono">{previewAttachmentItem.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAttachmentItem(null)}
                className="rounded-lg p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center bg-[#070e17] p-8 min-h-[300px]">
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  {previewAttachmentItem.mimeType.startsWith('image/') ? <ImageIcon size={32} /> : <FileArchive size={32} />}
                </div>
                <div className="mt-3 text-sm font-semibold text-[var(--psm-text)]">{previewAttachmentItem.fileName}</div>
                <div className="mt-1 text-xs text-[var(--psm-muted)]">Type: {previewAttachmentItem.attachmentType}</div>
                <button
                  type="button"
                  onClick={() => onDownload(previewAttachmentItem)}
                  className="psm-button psm-button-primary text-xs mt-4"
                >
                  <Download size={14} /> Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
