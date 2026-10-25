'use client';

import { Download, Eye, Trash2, Unlink } from 'lucide-react';
import { Badge, DetailCard, EmptyState } from '../moc-detail-ui';

export function EngineeringDocumentsTable({ documents, onPreview, onDownload, onDelete, onUnlink, readOnly }: { documents: any[]; onPreview: (doc: any) => void; onDownload: (doc: any) => void; onDelete: (id: string) => void; onUnlink: (id: string) => void; readOnly?: boolean }) {
  return (
    <DetailCard title="Engineering Documents">
      {!documents.length ? <EmptyState title="No engineering documents uploaded or linked yet." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="sticky top-0 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>{['Document', 'Type', 'Version', 'Status', 'Review Owner', 'Due', 'Blocking', 'Actions'].map((h) => <th key={h} className="px-3 py-2.5 font-bold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {documents.map((doc) => (
                <tr key={doc.id} className="text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-2)]">
                  <td className="px-3 py-3">
                    <p className="font-black text-[var(--psm-fg)]">{doc.title}</p>
                    <p className="text-xs text-[var(--psm-muted)]">{doc.file_name ?? doc.controlled_document_id ?? 'Controlled link'} · {doc.file_size ?? doc.size_bytes ?? 0} bytes</p>
                  </td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{doc.document_type}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{doc.version ?? doc.version_label ?? '-'}</td>
                  <td className="px-3 py-3"><Badge tone={doc.status === 'Approved' ? 'green' : doc.status === 'Rejected' ? 'red' : 'blue'}>{doc.status ?? 'Uploaded'}</Badge></td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{doc.review_owner_id ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{doc.review_due_date ?? '-'}</td>
                  <td className="px-3 py-3 text-xs text-[var(--psm-muted)]">{doc.required_before_approval ? 'Approval ' : ''}{doc.required_before_startup ? 'Startup ' : ''}{doc.required_before_closure ? 'Closure' : ''}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => onPreview(doc)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-primary hover:bg-[var(--psm-surface)] transition-all" title="Preview"><Eye size={14} /></button>
                      <button type="button" onClick={() => onDownload(doc)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-[var(--psm-fg)] hover:bg-[var(--psm-surface)] transition-all" title="Download"><Download size={14} /></button>
                      <button type="button" disabled={readOnly || !doc.controlled_document_id} onClick={() => onUnlink(doc.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-amber-500 hover:bg-[var(--psm-surface)] disabled:opacity-40 transition-all" title="Unlink"><Unlink size={14} /></button>
                      <button type="button" disabled={readOnly} onClick={() => onDelete(doc.id)} className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-600 dark:text-red-300 hover:bg-red-500/20 disabled:opacity-40 transition-all" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DetailCard>
  );
}
