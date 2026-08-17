import { DocumentStatusBadge } from '../shared/DocumentStatusBadge';
import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';

export function RequiredDocumentsReview({ documents }: { documents?: { evaluations?: Array<Record<string, unknown>>; links?: Array<Record<string, unknown>>; missing?: Array<Record<string, unknown>> } }) {
  const missing = documents?.missing ?? [];
  const links = documents?.links ?? [];
  return (
    <ReviewCard title="Required Documents Review" description="Document Control links, required evidence, and waiver-ready missing documents.">
      {missing.length ? <div className="mb-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{missing.length} required document(s) are missing.</div> : null}
      {!links.length && !missing.length ? <EmptyPanel>No document requirements returned for this approval.</EmptyPanel> : (
        <div className="grid gap-3 md:grid-cols-2">
          {links.map((doc) => <div key={String(doc.id ?? doc.document_id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{String(doc.document_number ?? doc.title ?? 'Linked document')}</p><DocumentStatusBadge status={String(doc.status ?? 'Linked')} /></div>)}
          {missing.map((doc) => <div key={String(doc.document_type ?? doc.id)} className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Missing {String(doc.document_type ?? doc.title ?? 'required document')}</div>)}
        </div>
      )}
    </ReviewCard>
  );
}
