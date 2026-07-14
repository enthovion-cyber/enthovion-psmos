'use client';

import { Download, Eye, Trash2 } from 'lucide-react';
import { Badge, DetailCard, EmptyState, statusTone } from '../moc-detail-ui';

export function MOCAttachmentsTable({ rows, onPreview, onDownload, onDelete }: any) {
  return (
    <DetailCard title="Attachments Table / Grid">
      {rows?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="sticky top-0 bg-[#07182a] text-xs uppercase text-slate-500">
              <tr>{['Title', 'Type', 'Section', 'File', 'Size', 'Uploaded By', 'Uploaded At', 'Status', 'Actions'].map((h) => <th key={h} className="border-b border-white/10 px-3 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id} className="border-b border-white/5 text-slate-300">
                  <td className="px-3 py-3 font-bold text-white">{row.title}</td>
                  <td className="px-3 py-3">{row.attachment_type}</td>
                  <td className="px-3 py-3">{row.related_section ?? '-'}</td>
                  <td className="px-3 py-3">{row.file_name ?? row.file_key ?? '-'}</td>
                  <td className="px-3 py-3">{formatBytes(row.file_size ?? 0)}</td>
                  <td className="px-3 py-3">{row.uploaded_by ?? '-'}</td>
                  <td className="px-3 py-3">{row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone(row.status)}>{row.status ?? 'Uploaded'}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button className="rounded-md border border-cyan-300/15 p-2 text-slate-100 hover:bg-blue-500/10" onClick={() => onPreview(row)} aria-label="Preview attachment"><Eye className="h-4 w-4" /></button>
                      <button className="rounded-md border border-cyan-300/15 p-2 text-slate-100 hover:bg-blue-500/10" onClick={() => onDownload(row.id)} aria-label="Download attachment"><Download className="h-4 w-4" /></button>
                      <button className="rounded-md border border-red-300/20 p-2 text-red-200 hover:bg-red-500/10" onClick={() => onDelete(row.id)} aria-label="Delete attachment"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="No MOC attachments uploaded yet." detail="Upload engineering evidence, field photos, meeting notes, vendor documents, and closure proof here." />}
    </DetailCard>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}
