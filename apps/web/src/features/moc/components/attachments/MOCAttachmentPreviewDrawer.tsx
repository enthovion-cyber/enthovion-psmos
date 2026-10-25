'use client';

import { Download, X } from 'lucide-react';
import { Badge, MocButton } from '../moc-detail-ui';

export function MOCAttachmentPreviewDrawer({ attachment, preview, onClose, onDownload }: any) {
  if (!attachment) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl text-[var(--psm-fg)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--psm-muted)] font-bold">Attachment Preview</p>
            <h2 className="mt-1 text-xl font-black text-[var(--psm-fg)]">{attachment.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="blue">{attachment.attachment_type ?? 'Attachment'}</Badge>
              <Badge tone="slate">{attachment.related_section ?? 'General'}</Badge>
            </div>
          </div>
          <button className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-[var(--psm-fg)] hover:bg-[var(--psm-surface)]" onClick={onClose} aria-label="Close attachment preview"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-5">
          <p className="text-sm text-[var(--psm-fg)]">{attachment.description ?? 'No description provided.'}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="File Name" value={attachment.file_name ?? attachment.file_key ?? '-'} />
            <Info label="MIME Type" value={attachment.mime_type ?? preview?.mimeType ?? '-'} />
            <Info label="Uploaded By" value={attachment.uploaded_by ?? '-'} />
            <Info label="Uploaded At" value={attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleString() : '-'} />
            <Info label="Document Version" value={attachment.document_version_id ?? '-'} />
            <Info label="Related Record" value={attachment.related_record_id ?? '-'} />
          </dl>
        </div>
        <div className="mt-5">
          <MocButton variant="primary" onClick={() => onDownload(attachment.id)} icon={<Download className="h-4 w-4" />}>Download</MocButton>
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</dt>
      <dd className="mt-1 font-bold text-[var(--psm-fg)]">{value}</dd>
    </div>
  );
}
