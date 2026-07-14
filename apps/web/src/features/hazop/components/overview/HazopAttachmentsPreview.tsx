'use client';

import type { ReactNode } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { HazopAvatar } from './HazopAvatarGroup';

export function HazopAttachmentsPreview({ preview, canDownload, onNavigate }: { preview: any; canDownload?: boolean; onNavigate: (tab?: string) => void }) {
  if (preview.restricted) return <Panel title="8. Attachments Preview"><Empty text="Restricted by permission." /></Panel>;
  return (
    <Panel title="8. Attachments Preview" action={<button onClick={() => onNavigate('Attachments')} className="text-xs font-semibold text-primary">View all</button>}>
      <div className="space-y-2">
        {(preview.rows ?? []).map((file: any) => (
          <div key={file.id} className="flex items-center gap-3 rounded-lg border border-[var(--psm-line)] p-3">
            <div className="rounded-lg bg-red-500/15 p-2 text-red-200"><FileText size={18} /></div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{file.file_name}</div>
              <div className="text-xs text-[var(--psm-muted)]">{file.category ?? 'General'} / {file.file_size ? `${Math.round(Number(file.file_size) / 1024)} KB` : 'metadata only'} / v{file.version ?? 1}</div>
              <HazopAvatar profile={file.uploadedBy} label={file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : 'Uploaded'} />
            </div>
            <button disabled={!canDownload} onClick={() => onNavigate('Attachments')} className="rounded border border-[var(--psm-line)] p-2 disabled:opacity-40"><Eye size={14} /></button>
            <button disabled={!canDownload} onClick={() => onNavigate('Attachments')} className="rounded border border-[var(--psm-line)] p-2 disabled:opacity-40"><Download size={14} /></button>
          </div>
        ))}
        {!(preview.rows ?? []).length ? <Empty text="No attachments uploaded." /> : null}
      </div>
    </Panel>
  );
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>{action}</div>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}
