'use client';

import { useMemo, useState } from 'react';
import { FileText, Filter, Upload } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useDocumentMutations, useDocumentOverdueReviews, useDocumentReviewDue, useDocuments } from '../hooks/useDocuments';
import { DocumentStatusBadge, DocumentTypeBadge } from './DocumentBadges';
import { DocumentUpload } from './DocumentUpload';

export function DocumentLibrary() {
  const [filters, setFilters] = useState({ search: '', status: '', documentType: '' });
  const [showUpload, setShowUpload] = useState(false);
  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);
  const documentsQuery = useDocuments(params);
  const reviewDue = useDocumentReviewDue();
  const overdue = useDocumentOverdueReviews();
  const mutations = useDocumentMutations();
  const toast = useMutationToast();
  const docs = documentsQuery.data ?? [];

  async function upload(input: Parameters<typeof mutations.upload.mutateAsync>[0]) {
    try {
      await mutations.upload.mutateAsync(input);
      toast.success('Document uploaded');
      setShowUpload(false);
    } catch (error) {
      toast.error('Upload failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <div className="space-y-5">
      <section className="psm-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div><h1 className="text-2xl font-semibold">Document Control</h1><p className="mt-1 text-sm text-[var(--psm-muted)]">Controlled, versioned, approved, reviewed, and auditable PSM documents.</p></div>
          <div className="grid gap-3 sm:grid-cols-3"><Metric label="Documents" value={String(docs.length)} /><Metric label="Review Due" value={String(reviewDue.data?.length ?? 0)} /><Metric label="Overdue" value={String(overdue.data?.length ?? 0)} danger /></div>
        </div>
      </section>
      <section className="psm-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold"><Filter size={16} /> Filters</div>
          <div className="flex flex-wrap gap-2">
            <input className="psm-input h-10 px-3 text-sm" placeholder="Search documents..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <input className="psm-input h-10 px-3 text-sm" placeholder="Type" value={filters.documentType} onChange={(e) => setFilters({ ...filters, documentType: e.target.value })} />
            <select className="psm-input h-10 px-3 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option><option>Draft</option><option>Under Review</option><option>Approved</option><option>Active</option><option>Obsolete</option><option>Archived</option></select>
            <button onClick={() => setShowUpload((current) => !current)} className="psm-button psm-button-primary"><Upload size={16} /> Upload Document</button>
          </div>
        </div>
      </section>
      {showUpload ? <DocumentUpload onUpload={upload} /> : null}
      <section className="psm-card overflow-hidden">
       <div className="overflow-auto">
  <table className="psm-table w-full min-w-[1100px] text-left text-sm">
    <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
      <tr>
        <th className="px-4 py-3">Document</th>
        <th className="px-4 py-3">Type</th>
        <th className="px-4 py-3">Status</th>
        <th className="px-4 py-3">Version</th>
        <th className="px-4 py-3">Owner</th>
        <th className="px-4 py-3">Review Due</th>
        <th className="px-4 py-3">Linked</th>
        <th className="px-4 py-3">Updated</th>
      </tr>
    </thead>
   <tbody>
  {/* 1. Only map if docs is strictly a verified Array */}
  {Array.isArray(docs) ? (
    docs.map((doc) => (
      <tr key={doc.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
        <td className="px-4 py-3">
          <a href={`/documents/${doc.id}`} className="font-semibold text-primary">
            {doc.document_number}
          </a>
          <div className="text-xs text-[var(--psm-muted)]">{doc.title}</div>
        </td>
        <td className="px-4 py-3"><DocumentTypeBadge type={doc.document_type} /></td>
        <td className="px-4 py-3"><DocumentStatusBadge status={doc.status} /></td>
        <td className="px-4 py-3">{doc.current_version?.version_number ?? '-'}</td>
        <td className="px-4 py-3">{doc.owner_id}</td>
        <td className="px-4 py-3">{doc.review?.[0]?.next_review_date ?? '-'}</td>
        <td className="px-4 py-3">{doc.relations?.length ?? 0}</td>
        <td className="px-4 py-3">{new Date(doc.updated_at).toLocaleDateString()}</td>
      </tr>
    ))
  ) : null}

  {/* 2. Safe loading/empty check */}
  {!Array.isArray(docs) || docs.length === 0 ? (
    <tr>
      <td colSpan={8} className="px-4 py-10 text-center text-[var(--psm-muted)]">
        {documentsQuery.isLoading ? 'Loading documents...' : 'No documents found.'}
      </td>
    </tr>
  ) : null}
</tbody>
  </table>
</div>
      </section>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</div><div className={`mt-2 text-2xl font-semibold ${danger ? 'text-danger' : ''}`}>{value}</div></div>;
}
