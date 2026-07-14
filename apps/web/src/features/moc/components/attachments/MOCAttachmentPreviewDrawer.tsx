'use client';

import { Download, X } from 'lucide-react';
import { Badge } from '../moc-detail-ui';

export function MOCAttachmentPreviewDrawer({ attachment, preview, onClose, onDownload }: any) {
  if (!attachment) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-300/15 bg-[#07182a] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Attachment Preview</p>
            <h2 className="mt-1 text-xl font-black text-white">{attachment.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2"><Badge tone="blue">{attachment.attachment_type ?? 'Attachment'}</Badge><Badge tone="slate">{attachment.related_section ?? 'General'}</Badge></div>
          </div>
          <button className="rounded-md border border-white/10 p-2 text-slate-200 hover:bg-white/10" onClick={onClose} aria-label="Close attachment preview"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm text-slate-300">{attachment.description ?? 'No description provided.'}</p>
          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <Info label="File Name" value={attachment.file_name ?? attachment.file_key ?? '-'} />
            <Info label="MIME Type" value={attachment.mime_type ?? preview?.mimeType ?? '-'} />
            <Info label="Uploaded By" value={attachment.uploaded_by ?? '-'} />
            <Info label="Uploaded At" value={attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleString() : '-'} />
            <Info label="Document Version" value={attachment.document_version_id ?? '-'} />
            <Info label="Related Record" value={attachment.related_record_id ?? '-'} />
          </dl>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500" onClick={() => onDownload(attachment.id)}><Download className="h-4 w-4" /> Download</button>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return <div><dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-bold text-slate-100">{value}</dd></div>;
}
