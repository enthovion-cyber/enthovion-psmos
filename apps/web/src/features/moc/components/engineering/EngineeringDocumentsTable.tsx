'use client';

import { Download, Eye, Trash2, Unlink } from 'lucide-react';
import { Badge, DetailCard, EmptyState } from '../moc-detail-ui';

export function EngineeringDocumentsTable({ documents, onPreview, onDownload, onDelete, onUnlink, readOnly }: { documents: any[]; onPreview: (doc: any) => void; onDownload: (doc: any) => void; onDelete: (id: string) => void; onUnlink: (id: string) => void; readOnly?: boolean }) {
  return (
    <DetailCard title="Engineering Documents">
      {!documents.length ? <EmptyState title="No engineering documents uploaded or linked yet." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="sticky top-0 bg-[#07182a] text-xs uppercase text-slate-500"><tr>{['Document', 'Type', 'Version', 'Status', 'Review Owner', 'Due', 'Blocking', 'Actions'].map((h) => <th key={h} className="border-b border-white/10 px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>{documents.map((doc) => <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.03]"><td className="px-3 py-3"><p className="font-black text-white">{doc.title}</p><p className="text-xs text-slate-500">{doc.file_name ?? doc.controlled_document_id ?? 'Controlled link'} · {doc.file_size ?? doc.size_bytes ?? 0} bytes</p></td><td className="px-3 py-3 text-slate-300">{doc.document_type}</td><td className="px-3 py-3 text-slate-300">{doc.version ?? doc.version_label ?? '-'}</td><td className="px-3 py-3"><Badge tone={doc.status === 'Approved' ? 'green' : doc.status === 'Rejected' ? 'red' : 'blue'}>{doc.status ?? 'Uploaded'}</Badge></td><td className="px-3 py-3 text-slate-300">{doc.review_owner_id ?? '-'}</td><td className="px-3 py-3 text-slate-300">{doc.review_due_date ?? '-'}</td><td className="px-3 py-3 text-xs text-slate-400">{doc.required_before_approval ? 'Approval ' : ''}{doc.required_before_startup ? 'Startup ' : ''}{doc.required_before_closure ? 'Closure' : ''}</td><td className="px-3 py-3"><div className="flex gap-1"><button type="button" onClick={() => onPreview(doc)} className="rounded-md border border-white/10 p-2 text-blue-200"><Eye size={14} /></button><button type="button" onClick={() => onDownload(doc)} className="rounded-md border border-white/10 p-2 text-cyan-100"><Download size={14} /></button><button type="button" disabled={readOnly || !doc.controlled_document_id} onClick={() => onUnlink(doc.id)} className="rounded-md border border-white/10 p-2 text-amber-200 disabled:opacity-40"><Unlink size={14} /></button><button type="button" disabled={readOnly} onClick={() => onDelete(doc.id)} className="rounded-md border border-red-300/20 p-2 text-red-200 disabled:opacity-40"><Trash2 size={14} /></button></div></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </DetailCard>
  );
}
