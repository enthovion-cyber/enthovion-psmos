'use client';

import { useState } from 'react';
import { CheckCircle2, Download, FileUp, Link2, Send, XCircle } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { documentsService } from '@/services/documents.service';
import { useDocument, useDocumentMutations } from '../hooks/useDocuments';
import { DocumentStatusBadge, DocumentTypeBadge } from './DocumentBadges';

const tabs = ['Overview', 'Preview', 'Versions', 'Linked Records', 'Review', 'Comments', 'Access Log', 'History'] as const;
type Tab = (typeof tabs)[number];

export function DocumentDetail({ id }: { id: string }) {
  const docQuery = useDocument(id);
  const mutations = useDocumentMutations(id);
  const toast = useMutationToast();
  const [tab, setTab] = useState<Tab>('Overview');
  const [comment, setComment] = useState('');
  const [decision, setDecision] = useState('');
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState('');
  const [relation, setRelation] = useState({ relatedModule: 'equipment', relatedRecordId: '', equipmentId: '', relationType: 'Reference' });
  const doc = docQuery.data;

  async function run(work: () => Promise<unknown>, message: string) {
    try {
      await work();
      toast.success(message);
      setComment('');
      setDecision('');
      setChangeSummary('');
      setVersionFile(null);
    } catch (error) {
      toast.error('Document request failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  if (docQuery.isLoading) return <div className="psm-card p-5">Loading document...</div>;
  if (!doc) return <div className="psm-card p-5 text-danger">Document not found.</div>;

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2"><DocumentStatusBadge status={doc.status} /><DocumentTypeBadge type={doc.document_type} /></div>
            <h1 className="text-2xl font-semibold">{doc.document_number}</h1>
            <p className="mt-1 text-lg">{doc.title}</p>
            <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{doc.description}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-96">
            <button onClick={() => run(() => mutations.submitReview.mutateAsync(), 'Submitted for review')} className="psm-button psm-button-secondary"><Send size={16} /> Submit Review</button>
            <button onClick={() => run(() => mutations.approve.mutateAsync(decision), 'Document approved')} className="psm-button psm-button-primary"><CheckCircle2 size={16} /> Approve</button>
            <button onClick={() => decision.trim() && run(() => mutations.reject.mutateAsync(decision), 'Document rejected')} className="psm-button psm-button-danger"><XCircle size={16} /> Reject</button>
            <button onClick={() => run(() => mutations.activate.mutateAsync(), 'Document activated')} className="psm-button psm-button-secondary">Activate</button>
          </div>
        </div>
        <textarea className="psm-input mt-4 min-h-16 w-full p-3 text-sm" placeholder="Approval/rejection comment..." value={decision} onChange={(e) => setDecision(e.target.value)} />
      </section>

      <div className="flex gap-2 overflow-auto border-b border-[var(--psm-line)]">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`px-3 py-3 text-sm font-semibold ${tab === item ? 'border-b-2 border-primary text-primary' : 'text-[var(--psm-muted)]'}`}>{item}</button>)}
      </div>

      {tab === 'Overview' ? <Card title="Overview"><Info label="Owner" value={doc.owner_id} /><Info label="Site" value={doc.site_id} /><Info label="Current Version" value={doc.current_version?.version_number ?? '-'} /><Info label="Tags" value={(doc.tags ?? []).map((tag) => tag.tag).join(', ') || '-'} /></Card> : null}
      {tab === 'Preview' ? <Card title="Preview / Download"><div className="flex flex-wrap gap-2"><a className="psm-button psm-button-primary" href={documentsService.previewUrl(id)} target="_blank"><FileUp size={16} /> Preview</a><a className="psm-button psm-button-secondary" href={documentsService.downloadUrl(id)}><Download size={16} /> Download</a></div><div className="mt-4 rounded-lg border border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">PDF, image, and text documents open in browser. DOCX/XLSX files download with access logging.</div></Card> : null}
      {tab === 'Versions' ? <Card title="Version History"><form onSubmit={(e) => { e.preventDefault(); if (versionFile && changeSummary) void run(() => mutations.uploadVersion.mutateAsync({ file: versionFile, changeSummary }), 'New version uploaded'); }} className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]"><input type="file" onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)} /><input className="psm-input h-10 px-3" placeholder="Change summary" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} /><button className="psm-button psm-button-primary">Upload Version</button></form><Rows rows={doc.versions ?? []} fields={['version_number', 'file_name', 'change_summary', 'uploaded_at']} /></Card> : null}
      {tab === 'Linked Records' ? <Card title="Linked Records"><form onSubmit={(e) => { e.preventDefault(); const payload: { relatedModule: string; relatedRecordId: string; relationType: string; equipmentId?: string } = { relatedModule: relation.relatedModule, relatedRecordId: relation.relatedRecordId, relationType: relation.relationType }; if (relation.equipmentId) payload.equipmentId = relation.equipmentId; void run(() => mutations.addRelation.mutateAsync(payload), 'Relation linked'); }} className="mb-4 grid gap-2 md:grid-cols-4"><input className="psm-input h-10 px-3" value={relation.relatedModule} onChange={(e) => setRelation({ ...relation, relatedModule: e.target.value })} /><input className="psm-input h-10 px-3" placeholder="Record ID" value={relation.relatedRecordId} onChange={(e) => setRelation({ ...relation, relatedRecordId: e.target.value })} /><input className="psm-input h-10 px-3" placeholder="Equipment ID" value={relation.equipmentId} onChange={(e) => setRelation({ ...relation, equipmentId: e.target.value })} /><button className="psm-button psm-button-primary"><Link2 size={16} /> Link</button></form><Rows rows={doc.relations ?? []} fields={['related_module', 'related_record_id', 'relation_type', 'created_at']} /></Card> : null}
      {tab === 'Review' ? <Card title="Review Cycle"><Rows rows={doc.review ?? []} fields={['review_frequency_months', 'last_review_date', 'next_review_date', 'review_status', 'review_owner_id']} /></Card> : null}
      {tab === 'Comments' ? <Card title="Comments"><form onSubmit={(e) => { e.preventDefault(); if (comment.trim()) void run(() => mutations.addComment.mutateAsync(comment), 'Comment added'); }} className="mb-4 flex gap-2"><input className="psm-input h-10 flex-1 px-3" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add comment..." /><button className="psm-button psm-button-primary">Add</button></form><Rows rows={doc.comments ?? []} fields={['author_id', 'body', 'created_at']} /></Card> : null}
      {tab === 'Access Log' ? <Card title="Access Log"><Rows rows={doc.access_logs ?? []} fields={['user_id', 'action', 'created_at']} /></Card> : null}
      {tab === 'History' ? <Card title="Approval History"><Rows rows={doc.approvals ?? []} fields={['approver_id', 'decision', 'comment', 'created_at']} /></Card> : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="psm-card p-5"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">{title}</h2>{children}</section>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="mb-3 rounded-lg bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}
function Rows({ rows, fields }: { rows: any[]; fields: string[] }) {
  if (!rows.length) return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center text-sm text-[var(--psm-muted)]">No records.</div>;
  return <div className="overflow-auto"><table className="psm-table w-full min-w-[720px] text-left text-sm"><thead><tr>{fields.map((field) => <th key={field} className="px-3 py-2 text-xs uppercase text-[var(--psm-muted)]">{field.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id ?? index} className="border-t border-[var(--psm-line)]">{fields.map((field) => <td key={field} className="px-3 py-2">{String(row[field] ?? '-')}</td>)}</tr>)}</tbody></table></div>;
}
