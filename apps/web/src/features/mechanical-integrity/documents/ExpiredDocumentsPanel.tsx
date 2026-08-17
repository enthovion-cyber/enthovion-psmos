import { DocumentStatusBadge } from '../shared/DocumentStatusBadge';
import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiDocumentLink } from '../types/mi-document.types';

export function ExpiredDocumentsPanel({ rows }: { rows?: MiDocumentLink[] }) {
  const expired = (rows ?? []).filter((row) => row.status === 'Expired');
  return <SectionCard title="Expired Documents Panel" description="Expired or review-overdue certificates and controlled documents.">{expired.length ? <div className="space-y-2">{expired.slice(0, 8).map((row) => <div key={row.id} className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm"><DocumentStatusBadge status={row.status} /> <strong>{cardValue(row.document_title)}</strong><p className="text-xs text-[var(--psm-muted)]">Expiry/review: {cardValue(row.expiry_date)}</p></div>)}</div> : <p className="text-sm text-success">No expired documents returned by Document Control.</p>}</SectionCard>;
}
