'use client';

import { Download, Eye, Trash2 } from 'lucide-react';
import { Badge, DetailCard, EmptyState, statusTone } from '../moc-detail-ui';

export function MOCAttachmentsTable({ rows, onPreview, onDownload, onDelete }: any) {
  return (
    <DetailCard title="Attachments Table / Grid">
      {rows?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="sticky top-0 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>
                {['Title', 'Type', 'Section', 'File', 'Size', 'Uploaded By', 'Uploaded At', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.map((row: any) => (
                <tr key={row.id} className="text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-2)]">
                  <td className="px-3 py-3 font-bold text-[var(--psm-fg)]">{row.title}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.attachment_type}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.related_section ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.file_name ?? row.file_key ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{formatBytes(row.file_size ?? 0)}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.uploaded_by ?? '-'}</td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">{row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone(row.status)}>{row.status ?? 'Uploaded'}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      <button className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-primary hover:bg-[var(--psm-surface)] transition-all" onClick={() => onPreview(row)} aria-label="Preview attachment"><Eye className="h-4 w-4" /></button>
                      <button className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-[var(--psm-fg)] hover:bg-[var(--psm-surface)] transition-all" onClick={() => onDownload(row.id)} aria-label="Download attachment"><Download className="h-4 w-4" /></button>
                      <button className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-600 dark:text-red-300 hover:bg-red-500/20 transition-all" onClick={() => onDelete(row.id)} aria-label="Delete attachment"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No MOC attachments uploaded yet." detail="Upload engineering evidence, field photos, meeting notes, vendor documents, and closure proof here." />
      )}
    </DetailCard>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}
